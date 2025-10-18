// src/utils/serverErrorBus.ts

export type ServerErrorPayload = {
  url: string
  method?: string
  status: number
  requestData?: any
  responseData?: any
  headers?: Record<string, any>
}

type Listener = (p: ServerErrorPayload) => void

const listeners = new Set<Listener>()

export const ServerErrorBus = {
  emit(payload: ServerErrorPayload) {
    for (const fn of listeners) fn(payload)
  },

  // NOTE: return type is () => void, and we wrap delete so the
  // cleanup function returns void (not the boolean from Set.delete).
  subscribe(fn: Listener): () => void {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  },
}
