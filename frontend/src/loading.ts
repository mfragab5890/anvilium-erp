type Listener = (active: boolean) => void

let counter = 0
const listeners = new Set<Listener>()

function emit() {
  const active = counter > 0
  for (const l of Array.from(listeners)) l(active)
}

export function beginLoading() {
  counter += 1
  emit()
}

export function endLoading() {
  counter = Math.max(0, counter - 1)
  emit()
}

export function subscribeLoading(listener: Listener) {
  listeners.add(listener)
  // initialize consumer with current state
  listener(counter > 0)
  return () => listeners.delete(listener)
}
