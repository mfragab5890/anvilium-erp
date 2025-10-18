// frontend/src/pages/admin/SuperAdmin.tsx
import * as React from 'react'
import {
  Box, Tabs, Tab, Stack, Typography, Chip, Button, IconButton, Tooltip,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper,
  TextField, InputAdornment, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, Switch, Collapse
} from '@mui/material'
import LaunchIcon from '@mui/icons-material/Launch'
import RefreshIcon from '@mui/icons-material/Refresh'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import BuildCircleIcon from '@mui/icons-material/BuildCircle'
import RemoveDoneIcon from '@mui/icons-material/RemoveDone'
import SearchIcon from '@mui/icons-material/Search'
import LinkIcon from '@mui/icons-material/Link'
import SaveIcon from '@mui/icons-material/Save'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import AddIcon from '@mui/icons-material/Add'
import api from '../../api'

/* --------------------- Tickets (unchanged) --------------------- */

type IssueSummary = {
  id: number
  created_at: string
  status: 'open' | 'in_progress' | 'resolved' | 'ignored'
  method: string | null
  url: string | null
  http_status: number | null
  note?: string | null
  pr_url?: string | null
}

type IssueDetail = IssueSummary & {
  request?: any
  response?: any
  headers?: any
}

const StatusChip: React.FC<{ value: IssueSummary['status'] }> = ({ value }) => {
  const map: Record<IssueSummary['status'], { label: string; color: 'default'|'primary'|'success'|'warning' }> = {
    open: { label: 'Open', color: 'primary' },
    in_progress: { label: 'In progress', color: 'warning' },
    resolved: { label: 'Resolved', color: 'success' },
    ignored: { label: 'Ignored', color: 'default' }
  }
  const m = map[value]
  return <Chip size="small" color={m.color} label={m.label} />
}

function useIssues() {
  const [items, setItems] = React.useState<IssueSummary[]>([])
  const [status, setStatus] = React.useState<'' | IssueSummary['status']>('' as const)
  const [q, setQ] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const fetchList = React.useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page: 1, per_page: 50 }
      if (status) params.status = status
      const { data } = await api.get('/admin/issues', { params })
      const list: IssueSummary[] = data.items || []
      setItems(
        q
          ? list.filter(
              (r) =>
                (r.url || '').toLowerCase().includes(q.toLowerCase()) ||
                (r.note || '').toLowerCase().includes(q.toLowerCase())
            )
          : list
      )
    } finally {
      setLoading(false)
    }
  }, [status, q])

  React.useEffect(() => { fetchList() }, [fetchList])

  return { items, status, setStatus, q, setQ, loading, refresh: fetchList }
}

const TicketsTab: React.FC = () => {
  const { items, status, setStatus, q, setQ, loading, refresh } = useIssues()
  const [detail, setDetail] = React.useState<IssueDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = React.useState(false)
  const [prUrl, setPrUrl] = React.useState('')

  const openDetail = async (id: number) => {
    setLoadingDetail(true)
    try {
      const { data } = await api.get(`/admin/issues/${id}`)
      setDetail(data)
      setPrUrl(data.pr_url || '')
    } finally {
      setLoadingDetail(false)
    }
  }

  const updateStatus = async (id: number, newStatus: IssueSummary['status']) => {
    await api.patch(`/admin/issues/${id}`, { status: newStatus })
    refresh()
    if (detail?.id === id) setDetail({ ...detail, status: newStatus })
  }

  const savePr = async (id: number) => {
    await api.patch(`/admin/issues/${id}`, { pr_url: prUrl || null })
    refresh()
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {(['', 'open', 'in_progress', 'resolved', 'ignored'] as const).map(v => (
            <Chip
              key={v || 'all'}
              size="small"
              color={status === v ? 'primary' : 'default'}
              label={v ? v.replace('_',' ') : 'All'}
              onClick={() => setStatus(v)}
              sx={{ textTransform:'capitalize' }}
            />
          ))}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search URL or note…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <Tooltip title="Refresh">
            <IconButton onClick={refresh}>
              {loading ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Paper variant="outlined">
        <TableContainer sx={{ maxHeight: 560 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell width={120}>Created</TableCell>
                <TableCell width={80}>Status</TableCell>
                <TableCell width={70}>Code</TableCell>
                <TableCell>URL</TableCell>
                <TableCell>Note</TableCell>
                <TableCell width={140}>PR</TableCell>
                <TableCell width={200} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell><StatusChip value={r.status} /></TableCell>
                  <TableCell>{r.http_status ?? ''}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label={r.method || 'REQ'} />
                      <Typography variant="body2" sx={{ maxWidth: 520 }} noWrap title={r.url || ''}>
                        {r.url}
                      </Typography>
                      <Tooltip title="Open details">
                        <IconButton size="small" onClick={() => openDetail(r.id)}>
                          <LaunchIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280 }} title={r.note || ''}>
                    <Typography variant="body2" noWrap>{r.note}</Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 160 }} title={r.pr_url || ''}>
                    <Typography variant="body2" noWrap>{r.pr_url}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Mark resolved">
                        <span>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<DoneAllIcon fontSize="small" />}
                            onClick={() => updateStatus(r.id, 'resolved')}
                          >
                            Resolve
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Mark in progress">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<BuildCircleIcon fontSize="small" />}
                          onClick={() => updateStatus(r.id, 'in_progress')}
                        >
                          In progress
                        </Button>
                      </Tooltip>
                      <Tooltip title="Ignore">
                        <Button
                          size="small"
                          color="inherit"
                          startIcon={<RemoveDoneIcon fontSize="small" />}
                          onClick={() => updateStatus(r.id, 'ignored')}
                        >
                          Ignore
                        </Button>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {items.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No tickets
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" fontWeight={700}>Ticket #{detail?.id}</Typography>
            {detail && <StatusChip value={detail.status} />}
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
          {loadingDetail ? (
            <Stack alignItems="center" sx={{ py: 6 }}>
              <CircularProgress />
            </Stack>
          ) : detail ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" label={detail.method || 'REQ'} />
                <Chip size="small" color="primary" label={detail.url || '/'} />
                <Chip size="small" variant="outlined" label={`HTTP ${detail.http_status ?? 500}`} />
              </Stack>

              <Divider textAlign="left">PR Link</Divider>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="https://github.com/org/repo/pull/123"
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
                <Button variant="contained" onClick={() => savePr(detail.id)}>Save</Button>
              </Stack>

              <Divider textAlign="left">Request</Divider>
              <CodeBlock value={detail.request} />

              <Divider textAlign="left">Response</Divider>
              <CodeBlock value={detail.response} />

              <Divider textAlign="left">Headers</Divider>
              <CodeBlock value={detail.headers} />
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          {detail && (
            <Stack direction="row" spacing={1} sx={{ mr: 'auto', pl: 2 }}>
              <Button size="small" onClick={() => updateStatus(detail.id, 'in_progress')}>In progress</Button>
              <Button size="small" color="success" variant="contained" onClick={() => updateStatus(detail.id, 'resolved')}>
                Resolve
              </Button>
            </Stack>
          )}
          <Button onClick={() => setDetail(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

/* --------------------- Modules + Tabs (wired) --------------------- */

type AdminModule = {
  code: string
  name_en?: string | null
  name_ar?: string | null
  is_active: boolean
  is_locked: boolean
}

type AdminTab = {
  module_code: string
  code: string
  name_en?: string | null
  name_ar?: string | null
  is_active: boolean
  is_locked: boolean
  sort_order: number
}

function useModules() {
  const [items, setItems] = React.useState<AdminModule[]>([])
  const [loading, setLoading] = React.useState(false)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/modules')
      setItems(data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { refresh() }, [refresh])

  return { items, loading, refresh, setItems }
}

const ModuleTabsArea: React.FC<{
  moduleCode: string
}> = ({ moduleCode }) => {
  const [tabs, setTabs] = React.useState<AdminTab[] | null>(null)
  const [loading, setLoading] = React.useState(false)

  const [newCode, setNewCode] = React.useState('')
  const [newNameEN, setNewNameEN] = React.useState('')
  const [newSort, setNewSort] = React.useState<number | ''>(0)
  const [creating, setCreating] = React.useState(false)

  const fetchTabs = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/modules/${encodeURIComponent(moduleCode)}/tabs`)
      setTabs((data || []).sort((a: AdminTab, b: AdminTab) => (a.sort_order ?? 0) - (b.sort_order ?? 0)))
    } finally {
      setLoading(false)
    }
  }, [moduleCode])

  React.useEffect(() => { fetchTabs() }, [fetchTabs])

  const savePatch = async (tabCode: string, patch: Partial<AdminTab>) => {
    await api.put(`/admin/modules/${encodeURIComponent(moduleCode)}/tabs/${encodeURIComponent(tabCode)}`, patch)
    await fetchTabs()
  }

  const createTab = async () => {
    if (!newCode.trim()) return
    setCreating(true)
    try {
      await api.post(`/admin/modules/${encodeURIComponent(moduleCode)}/tabs`, {
        code: newCode.trim(),
        name_en: newNameEN || newCode.trim(),
        sort_order: typeof newSort === 'number' ? newSort : 0,
        is_active: true,
        is_locked: false
      })
      setNewCode(''); setNewNameEN(''); setNewSort(0)
      await fetchTabs()
    } finally {
      setCreating(false)
    }
  }

  return (
    <Box sx={{ p: 2, bgcolor: 'background.default', borderTop: (t)=>`1px dashed ${t.palette.divider}` }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          Tabs for <strong>{moduleCode}</strong>
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Refresh tabs">
            <IconButton size="small" onClick={fetchTabs}>
              {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Add Tab */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={1} alignItems={{ xs:'stretch', sm:'center' }}>
          <TextField
            size="small"
            label="Code"
            sx={{ minWidth: 160 }}
            value={newCode}
            onChange={(e)=>setNewCode(e.target.value)}
          />
          <TextField
            size="small"
            label="Name (EN)"
            sx={{ minWidth: 220 }}
            value={newNameEN}
            onChange={(e)=>setNewNameEN(e.target.value)}
          />
          <TextField
            size="small"
            label="Sort"
            type="number"
            sx={{ width: 100 }}
            value={newSort}
            onChange={(e)=>setNewSort(e.target.value === '' ? '' : Number(e.target.value))}
          />
          <Button
            size="small"
            startIcon={<AddIcon />}
            variant="contained"
            onClick={createTab}
            disabled={creating || !newCode.trim()}
          >
            Add Tab
          </Button>
        </Stack>
      </Paper>

      {/* Tabs table */}
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name (EN)</TableCell>
                <TableCell>Name (AR)</TableCell>
                <TableCell width={90} align="center">Sort</TableCell>
                <TableCell align="center">Active</TableCell>
                <TableCell align="center">Locked</TableCell>
                <TableCell align="right" width={120}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(tabs || []).map(t => (
                <TabRow key={t.code} t={t} onSave={(patch)=>savePatch(t.code, patch)} />
              ))}
              {(tabs && tabs.length === 0 && !loading) && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No tabs yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

const TabRow: React.FC<{
  t: AdminTab
  onSave: (patch: Partial<AdminTab>) => Promise<void>
}> = ({ t, onSave }) => {
  const [nameEN, setNameEN] = React.useState(t.name_en || '')
  const [nameAR, setNameAR] = React.useState(t.name_ar || '')
  const [sort, setSort] = React.useState<number | ''>(t.sort_order ?? 0)
  const [saving, setSaving] = React.useState(false)

  const dirty =
    nameEN !== (t.name_en || '') ||
    nameAR !== (t.name_ar || '') ||
    (sort === '' ? 0 : sort) !== (t.sort_order ?? 0)

  const save = async () => {
    setSaving(true)
    try {
      await onSave({
        name_en: nameEN || null,
        name_ar: nameAR || null,
        sort_order: sort === '' ? 0 : Number(sort)
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (val: boolean) => {
    setSaving(true)
    try { await onSave({ is_active: val }) } finally { setSaving(false) }
  }

  const toggleLocked = async (val: boolean) => {
    setSaving(true)
    try { await onSave({ is_locked: val }) } finally { setSaving(false) }
  }

  return (
    <TableRow hover>
      <TableCell sx={{ fontWeight: 600 }}>{t.code}</TableCell>
      <TableCell sx={{ minWidth: 200 }}>
        <TextField size="small" fullWidth value={nameEN} onChange={(e)=>setNameEN(e.target.value)} />
      </TableCell>
      <TableCell sx={{ minWidth: 200 }}>
        <TextField size="small" fullWidth value={nameAR} onChange={(e)=>setNameAR(e.target.value)} />
      </TableCell>
      <TableCell width={90} align="center">
        <TextField
          size="small"
          type="number"
          value={sort}
          onChange={(e)=>setSort(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ width: 80 }}
        />
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <Switch checked={t.is_active} onChange={(_,v)=>toggleActive(v)} />
          <Chip size="small" label={t.is_active ? 'Active' : 'Inactive'} color={t.is_active ? 'success':'default'} />
        </Stack>
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <Switch checked={t.is_locked} onChange={(_,v)=>toggleLocked(v)} />
          <Chip
            size="small"
            icon={t.is_locked ? <LockOutlinedIcon /> : <LockOpenOutlinedIcon />}
            label={t.is_locked ? 'Locked' : 'Unlocked'}
            color={t.is_locked ? 'default' : 'primary'}
            variant={t.is_locked ? 'outlined' : 'filled'}
          />
        </Stack>
      </TableCell>
      <TableCell align="right" width={120}>
        <Tooltip title={dirty ? 'Save' : 'Saved'}>
          <span>
            <Button
              size="small"
              variant="contained"
              startIcon={<SaveIcon fontSize="small" />}
              disabled={!dirty || saving}
              onClick={save}
            >
              Save
            </Button>
          </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}

const ModuleRow: React.FC<{
  m: AdminModule
  onSave: (code: string, patch: Partial<AdminModule>) => Promise<void>
}> = ({ m, onSave }) => {
  const [nameEN, setNameEN] = React.useState(m.name_en || '')
  const [nameAR, setNameAR] = React.useState(m.name_ar || '')
  const [saving, setSaving] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  const dirty = nameEN !== (m.name_en || '') || nameAR !== (m.name_ar || '')

  const save = async () => {
    setSaving(true)
    try {
      await onSave(m.code, { name_en: nameEN || null, name_ar: nameAR || null })
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (val: boolean) => {
    setSaving(true)
    try { await onSave(m.code, { is_active: val }) } finally { setSaving(false) }
  }

  const toggleLocked = async (val: boolean) => {
    setSaving(true)
    try { await onSave(m.code, { is_locked: val }) } finally { setSaving(false) }
  }

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ fontWeight: 700, display:'flex', alignItems:'center', gap:.5 }}>
          <IconButton size="small" onClick={()=>setOpen(o=>!o)} sx={{ mr: .5 }}>
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
          {m.code}
        </TableCell>
        <TableCell sx={{ minWidth: 220 }}>
          <TextField size="small" fullWidth value={nameEN} onChange={(e)=>setNameEN(e.target.value)} />
        </TableCell>
        <TableCell sx={{ minWidth: 220 }}>
          <TextField size="small" fullWidth value={nameAR} onChange={(e)=>setNameAR(e.target.value)} />
        </TableCell>
        <TableCell align="center">
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
            <Switch checked={m.is_active} onChange={(_,v)=>toggleActive(v)} />
            <Chip size="small" label={m.is_active ? 'Active' : 'Inactive'} color={m.is_active ? 'success':'default'} />
          </Stack>
        </TableCell>
        <TableCell align="center">
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
            <Switch checked={m.is_locked} onChange={(_,v)=>toggleLocked(v)} />
            <Chip
              size="small"
              icon={m.is_locked ? <LockOutlinedIcon /> : <LockOpenOutlinedIcon />}
              label={m.is_locked ? 'Locked' : 'Unlocked'}
              color={m.is_locked ? 'default' : 'primary'}
              variant={m.is_locked ? 'outlined' : 'filled'}
            />
          </Stack>
        </TableCell>
        <TableCell align="right" width={120}>
          <Tooltip title={dirty ? 'Save names' : 'Saved'}>
            <span>
              <Button
                size="small"
                variant="contained"
                startIcon={<SaveIcon fontSize="small" />}
                disabled={!dirty || saving}
                onClick={save}
              >
                Save
              </Button>
            </span>
          </Tooltip>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <ModuleTabsArea moduleCode={m.code} />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

const ModulesTab: React.FC = () => {
  const { items, loading, refresh } = useModules()

  const savePatch = async (code: string, patch: Partial<AdminModule>) => {
    await api.put(`/admin/modules/${encodeURIComponent(code)}`, patch)
    await refresh()
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" fontWeight={700}>Modules</Typography>
            {loading && <CircularProgress size={16} />}
          </Stack>
          <Tooltip title="Refresh">
            <IconButton onClick={refresh}><RefreshIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name (EN)</TableCell>
                <TableCell>Name (AR)</TableCell>
                <TableCell align="center">Active</TableCell>
                <TableCell align="center">Locked</TableCell>
                <TableCell align="right" width={120}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(m => (
                <ModuleRow key={m.code} m={m} onSave={savePatch} />
              ))}
              {items.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No modules
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  )
}

/* --------------------- Shared --------------------- */

const CodeBlock: React.FC<{ value: any }> = ({ value }) => {
  const text =
    typeof value === 'string' ? value :
    value ? JSON.stringify(value, null, 2) : '—'
  return (
    <Box
      component="pre"
      sx={{
        m: 0, p: 1.5, borderRadius: 1, bgcolor: 'background.paper',
        fontSize: 12, overflowX: 'auto', border: (t) => `1px solid ${t.palette.divider}`
      }}
    >
      {text}
    </Box>
  )
}

export default function SuperAdmin() {
  const [tab, setTab] = React.useState(0)
  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h6" fontWeight={700}>Super Admin</Typography>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Tickets" />
        <Tab label="Modules" />
      </Tabs>

      {tab === 0 && <TicketsTab />}
      {tab === 1 && <ModulesTab />}
    </Box>
  )
}
