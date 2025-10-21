import * as React from 'react'
import { Box, TextField, Stack } from '@mui/material'
import { DataGrid, GridColDef, GridSortModel } from '@mui/x-data-grid'
import api from '../api'

type Props<T = any> = {
  endpoint: string                       // e.g. '/hr/employees'
  columns: GridColDef[]                  // DataGrid columns
  getRowId?: (row: T) => string | number // default: row.id
  initialPageSize?: number               // default 10
  searchPlaceholder?: string             // default 'Search'
  extraParams?: Record<string, any>      // branch filters, etc.
}

type PageResp<T> = {
  items: T[]
  total: number
}

export default function ServerGrid<T = any>({
  endpoint,
  columns,
  getRowId,
  initialPageSize = 10,
  searchPlaceholder = 'Search',
  extraParams = {}
}: Props<T>) {
  const [rows, setRows] = React.useState<T[]>([])
  const [rowCount, setRowCount] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const loadingRef = React.useRef(false)

  // ✅ MUI v6 uses a single paginationModel object (not separate page/pageSize props)
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: initialPageSize })
  const [sortModel, setSortModel] = React.useState<GridSortModel>([])
  const [search, setSearch] = React.useState('')
  const [searchDebounced, setSearchDebounced] = React.useState('')

  // debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const fetchData = React.useCallback(async () => {
    // Prevent concurrent API calls
    if (loadingRef.current) {
      console.log('⏳ fetchData skipped - already loading')
      return
    }

    loadingRef.current = true
    setLoading(true)

    try {
      const sort = sortModel[0]
      const params = {
        page: paginationModel.page + 1,     // BE usually 1-based
        size: paginationModel.pageSize,
        q: searchDebounced || undefined,
        sort: sort?.field,
        order: sort?.sort,
        ...extraParams
      }
      const res = await api.get(endpoint, { params })
      const data: PageResp<T> = res.data
      const items = Array.isArray(data as any)
        ? (data as any as T[])
        : (data.items ?? (data as any).data ?? [])
      const total = (data as any).total ?? items.length
      setRows(items)
      setRowCount(total)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [endpoint, paginationModel.page, paginationModel.pageSize, searchDebounced, sortModel, extraParams])

  React.useEffect(() => {
    fetchData()
  }, [paginationModel.page, paginationModel.pageSize, searchDebounced, sortModel]) // Call when dependencies change

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 320 }}
        />
      </Stack>

      <div style={{ width: '100%' }}>
        <DataGrid
          autoHeight
          density="compact"
          rows={rows as any[]}
          getRowId={getRowId as any}
          rowCount={rowCount}
          loading={loading}
          disableColumnFilter
          pagination
          paginationMode="server"
          sortingMode="server"
          // ✅ v6: use paginationModel object
          paginationModel={paginationModel}
          onPaginationModelChange={(model) => setPaginationModel(model)}
          pageSizeOptions={[10, 25, 50, 100]}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          columns={columns}
        />
      </div>
    </Box>
  )
}
