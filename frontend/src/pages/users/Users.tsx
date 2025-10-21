import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Box, Typography, TextField, Stack, IconButton, Chip, Alert
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Global } from '@emotion/react'
import {
  DataGrid, type GridColDef, type GridPaginationModel
} from '@mui/x-data-grid'
import RefreshIcon from '@mui/icons-material/Refresh'
import api from '../../api'

type User = {
  id: number
  email: string
  first_name: string
  last_name: string
  is_active?: boolean
  role_code?: string
  role?: { code?: string } | null
}

type PageResp<T> = { items: T[]; page: number; size: number; total: number; pages: number }

export default function Users() {
  const theme = useTheme()
  const [rows, setRows] = useState<User[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [qDebounced, setQDebounced] = useState('')
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 50 }) // default 50
  const loadingRef = useRef(false)

  const cols: GridColDef<User>[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 220 },
    { field: 'first_name', headerName: 'First name', flex: 1, minWidth: 140 },
    { field: 'last_name', headerName: 'Last name', flex: 1, minWidth: 140 },
    { field: 'role_code', headerName: 'Role', flex: 1, minWidth: 140 },

    {
      field: 'is_active', headerName: 'Status', width: 120,
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

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 350)
    return () => clearTimeout(t)
  }, [q])

  const fetchPage = useCallback(async () => {
    // Prevent concurrent API calls
    if (loadingRef.current) {
      console.log('⏳ fetchPage skipped - already loading')
      return
    }

    console.log('🚀 fetchPage called with:', {
      page: paginationModel.page + 1,
      size: paginationModel.pageSize,
      search: qDebounced
    })

    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const { data } = await api.get<PageResp<User>>('/users/', {
        params: { page: paginationModel.page + 1, size: paginationModel.pageSize, q: qDebounced }
      })
      console.log('✅ fetchPage completed:', data.items?.length, 'items')
      setRows(data.items || [])
      setRowCount(data.total || 0)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 403) setError("You don't have permission to view users.")
      else setError(err?.response?.data?.message || err?.message || 'Failed to load users')
      setRows([]); setRowCount(0)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [paginationModel.page, paginationModel.pageSize, qDebounced]) // Removed loading from dependencies

  useEffect(() => {
    console.log('🔄 useEffect triggered:', {
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
      search: qDebounced,
      timestamp: Date.now()
    })
    fetchPage()
  }, [paginationModel.page, paginationModel.pageSize, qDebounced]) // Call on mount and when dependencies change

  const runSearch = () => {
    // Update debounced search immediately and reset to page 0
    setQDebounced(q)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') runSearch() }

  return (
    <Box>
      <Global styles={{
        '@keyframes orbit': { to: { transform: 'rotate(1turn)' } }
      }} />

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ position: 'relative', fontWeight: 800 }}>
          Users
          <Box
            component="span"
            sx={{
              position: 'absolute', left: 0, bottom: -6, height: 2, width: 48,
              background: 'linear-gradient(90deg,#6ee7ff,#6b8cff,#a78bfa,#6ee7ff)',
              borderRadius: 2, opacity: .6
            }}
          />
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            sx={{ width: 280 }}
          />
          <IconButton aria-label="reload" onClick={runSearch} disabled={loading}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

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
        <DataGrid<User>
          rows={rows}
          columns={cols}
          getRowId={(r) => r.id}
          loading={loading}
          density="compact"
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            color: 'text.primary',
            '& .MuiDataGrid-columnHeaders': {
              borderBottom: theme.palette.mode === 'dark'
                ? '1px solid rgba(120,140,255,.25)'
                : '1px solid rgba(90,120,255,.25)',
              background:
                'linear-gradient(0deg, rgba(110,231,255,.08), rgba(167,139,250,.08))',
              backdropFilter: 'blur(4px)'
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
