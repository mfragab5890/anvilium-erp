// frontend/src/components/ServerErrorGateway.tsx
import * as React from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Chip, Stack, TextField, Alert, CircularProgress
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import api from '../api'
import { useAuth } from '../store/auth'
import { ServerErrorBus, type ServerErrorPayload } from '../utils/serverErrorBus'

export default function ServerErrorGateway() {
  const { user } = useAuth()

  const [open, setOpen] = React.useState(false)
  const [err, setErr] = React.useState<ServerErrorPayload | null>(null)
  const [note, setNote] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [submittedId, setSubmittedId] = React.useState<number | null>(null)

  // Listen for any 500s emitted by the axios interceptor
  React.useEffect(() => {
    const unsub = ServerErrorBus.subscribe((payload) => {
      setErr(payload)
      setNote('')
      setSubmittedId(null)
      setOpen(true)
    })
    return unsub // proper cleanup
  }, [])

  const handleClose = () => {
    if (submitting) return
    setOpen(false)
  }

  const handleReport = async () => {
    if (!err) return
    setSubmitting(true)
    try {
      // We hide tech details from the user, but still send them to BE.
      const body = {
        method: err.method,
        url: err.url,
        status: err.status,
        note: note?.trim() || null,
        client: {
          user_id: user?.id ?? null,
          user_email: user?.email ?? null,
          user_name: user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : null,
          route: window.location.pathname,
          full_url: window.location.href,
          locale: localStorage.getItem('lang') || undefined,
          ua: navigator.userAgent
        },
        request: err.requestData ?? null,
        response: err.responseData ?? null,
        headers: err.headers ?? null
      }

      const { data } = await api.post('/admin/issues', body)
      setSubmittedId(data?.id ?? 0)
    } catch {
      // keep the dialog open; you could show an inline error if desired
    } finally {
      setSubmitting(false)
    }
  }

  const method = err?.method || 'REQ'
  const url = err?.url || '/'
  const status = err?.status || 500

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" fontWeight={700}>Server issue occurred</Typography>
          <Chip size="small" label={`HTTP ${status}`} />
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" label={method} />
            <Chip size="small" color="primary" label={url} />
          </Stack>

          {submittedId ? (
            <Alert icon={<CheckCircleOutlineIcon />} severity="success" variant="outlined">
              Issue reported successfully. We’ll investigate and fix it ASAP.
              {!!submittedId && (
                <Typography component="span" sx={{ ml: 1 }} color="text.secondary">
                  Ref #{submittedId}
                </Typography>
              )}
            </Alert>
          ) : (
            <>
              <Typography variant="body2">
                Do you want to report this to the system administrator?
              </Typography>

              <TextField
                multiline minRows={3} fullWidth
                placeholder="Additional notes (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Close
        </Button>

        {!submittedId && (
          <Button
            onClick={handleReport}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : undefined}
          >
            {submitting ? 'Reporting…' : 'Report'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
