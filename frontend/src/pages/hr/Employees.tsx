// frontend/src/pages/hr/Employees.tsx
import * as React from 'react'
import {
  Box, Button, TextField, Typography, Alert, MenuItem, Select, FormControl, InputLabel,
  Chip, Stack, IconButton
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Global } from '@emotion/react'
import {
  DataGrid, type GridColDef, type GridPaginationModel, type GridSortModel
} from '@mui/x-data-grid'
import RefreshIcon from '@mui/icons-material/Refresh'
import api from '../../api'

type Row = {
  id: number
  code: string
  first_name: string
  last_name: string
  email?: string | null
  is_active: boolean
}

type PageResp<T> = { items: T[]; page: number; size: number; total: number; pages: number }

export default function Employees() {
  const theme = useTheme()

  // table state
  const [rows, setRows] = React.useState<Row[]>([])
  const [rowCount, setRowCount] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // filters
  const [q, setQ] = React.useState('')
  const [branch, setBranch] = React.useState<string>('ALL')

  // server pagination & sorting
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({ page: 0, pageSize: 50 })
  const [sortModel, setSortModel] = React.useState<GridSortModel>([]) // we’ll only map first_name/last_name

  const orderParam = React.useMemo(() => {
    if (!sortModel.length) return undefined
    const { field, sort } = sortModel[0]!
    if (!sort) return undefined
    if (field === 'first_name' || field === 'last_name') {
      return sort === 'asc' ? 'name_asc' : 'name_desc'
    }
    // unsupported fields fall back to API default ordering
    return undefined
  }, [sortModel])

  const cols: GridColDef<Row>[] = [
    { field: 'id', headerName: 'ID', width: 80, sortable: false },
    { field: 'code', headerName: 'Code', width: 140, sortable: false },
    { field: 'first_name', headerName: 'First name', flex: 1, minWidth: 140, sortable: true },
    { field: 'last_name', headerName: 'Last name', flex: 1, minWidth: 140, sortable: true },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 220, sortable: false },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 130,
      sortable: false,
      renderCell: (p) => (
        <Chip
          size="small"
          label={p.row.is_active ? 'Active' : 'Inactive'}
          color={p.row.is_active ? 'success' : 'default'}
          variant={p.row.is_active ? 'filled' : 'outlined'}
        />
      )
    },
  ]

  const fetchPage = async (model = paginationModel) => {
    setLoading(true); setError(null)
    try {
      const { page, pageSize } = model
      const { data } = await api.get<PageResp<Row>>('/hr/employees/', {
        params: {
          page: page + 1,       // API is 1-based
          size: pageSize,
          q: q || undefined,
          branch: branch || undefined,
          order: orderParam
        }
      })
      setRows(data.items || [])
      setRowCount(data.total || 0)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 403) setError("You don't have permission to view employees.")
      else setError(err?.response?.data?.message || err?.message || 'Failed to load employees')
      setRows([]); setRowCount(0)
    } finally {
      setLoading(false)
    }
  }

  // initial load
  React.useEffect(() => { fetchPage() }, []) // eslint-disable-line

  // react to page / size changes
  React.useEffect(() => { fetchPage() }, [paginationModel.page, paginationModel.pageSize]) // eslint-disable-line

  // react to sort changes
  React.useEffect(() => { fetchPage({ ...paginationModel, page: 0 }); setPaginationModel(m => ({ ...m, page: 0 })) }, [orderParam]) // eslint-disable-line

  // auto-refetch on branch change (reset to page 0)
  React.useEffect(() => { fetchPage({ ...paginationModel, page: 0 }); setPaginationModel(m => ({ ...m, page: 0 })) }, [branch]) // eslint-disable-line

  // manual search (Enter or button)
  const runSearch = () => { setPaginationModel(m => ({ ...m, page: 0 })); fetchPage({ ...paginationModel, page: 0 }) }
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') runSearch() }

  return (
    <Box>
      {/* keyframes once */}
      <Global styles={{
        '@keyframes orbit': { to: { transform: 'rotate(1turn)' } },
        '@keyframes lineDraw': { to: { strokeDashoffset: 0 } }
      }} />

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ position: 'relative', fontWeight: 800 }}>
          Employees
          <Box
            component="span"
            sx={{
              position: 'absolute', left: 0, bottom: -6, height: 2, width: 64,
              background: 'linear-gradient(90deg,#6ee7ff,#6b8cff,#a78bfa,#6ee7ff)',
              borderRadius: 2, opacity: .6
            }}
          />
        </Typography>

        <IconButton aria-label="reload" onClick={() => fetchPage({ ...paginationModel })} disabled={loading}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box
        sx={{
          display: 'flex', gap: 2, alignItems: 'center', mb: 2,
          px: 1.5, py: 1, borderRadius: 2,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(12,16,30,.55)' : 'rgba(255,255,255,.75)',
          backdropFilter: 'blur(8px) saturate(130%)',
          border: theme.palette.mode === 'dark'
            ? '1px solid rgba(120,140,255,.25)' : '1px solid rgba(90,120,255,.35)'
        }}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="branch">Branch</InputLabel>
          <Select
            labelId="branch"
            label="Branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            <MenuItem value="ALL">ALL</MenuItem>
            {/* TODO: replace with real branches from API */}
            <MenuItem value="DXB">Dubai</MenuItem>
            <MenuItem value="AUH">Abu Dhabi</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          sx={{ width: 320 }}
        />

        <Button variant="contained" onClick={runSearch} disabled={loading}>
          SEARCH
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box
        sx={{
          height: 560, width: '100%', position: 'relative',
          borderRadius: 2, overflow: 'hidden',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(12,16,30,.45)' : 'rgba(255,255,255,.8)',
          backdropFilter: 'blur(8px) saturate(130%)',
          border: theme.palette.mode === 'dark'
            ? '1px solid rgba(120,140,255,.25)' : '1px solid rgba(90,120,255,.35)',
          '&:before': {
            content: '""', position: 'absolute', inset: -1, borderRadius: 2, padding: '1px',
            background: 'conic-gradient(from 0turn, #6ee7ff, #6b8cff, #a78bfa, #6ee7ff)',
            WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor', maskComposite: 'exclude',
            opacity: .25, filter: 'blur(1px)', pointerEvents: 'none'
          }
        }}
      >
        <DataGrid<Row>
          rows={rows}
          columns={cols}
          getRowId={(r) => r.id}
          loading={loading}
          density="compact"
          disableRowSelectionOnClick

          // SERVER PAGINATION
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]}

          // SERVER SORTING (Name only mapped)
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={setSortModel}

          sx={{
            border: 'none',
            color: 'text.primary',
            '& .MuiDataGrid-columnHeaders': {
              borderBottom: theme.palette.mode === 'dark'
                ? '1px solid rgba(120,140,255,.25)'
                : '1px solid rgba(90,120,255,.25)',
              background:
                'linear-gradient(0deg, rgba(110,231,255,.08), rgba(167,139,250,.08))',
              backdropFilter: 'blur(4px)',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: theme.palette.mode === 'dark'
                ? '1px solid rgba(120,140,255,.25)'
                : '1px solid rgba(90,120,255,.25)',
              background: 'transparent',
              backdropFilter: 'blur(4px)'
            },
            '& .MuiDataGrid-row:hover': {
              background:
                'linear-gradient(90deg, rgba(110,231,255,.06), rgba(167,139,250,.06))'
            },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
              outline: 'none'
            },
            '& .MuiDataGrid-columnSeparator': { opacity: .2 }
          }}
        />
      </Box>
    </Box>
  )
}
