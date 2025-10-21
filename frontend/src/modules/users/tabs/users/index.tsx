import * as React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Box, Typography } from '@mui/material'
import ServerGrid from '../../../../ui/ServerGrid'

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'code', headerName: 'Code', flex: 1, minWidth: 120 },
  { field: 'first_name', headerName: 'First Name', flex: 1, minWidth: 140 },
  { field: 'last_name', headerName: 'Last Name', flex: 1, minWidth: 140 },
  { field: 'email', headerName: 'Email', flex: 1.4, minWidth: 200 },
  {
    field: 'is_active',
    headerName: 'Active',
    width: 110,
    valueGetter: (p: any) => (p.value ? 'Yes' : 'No'),
  },
]

export default function UsersTab() {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
        Users
      </Typography>

      <ServerGrid
        endpoint="/users"
        columns={columns}
        getRowId={(r: any) => r.id}
        searchPlaceholder="Search users"
      />
    </Box>
  )
}
