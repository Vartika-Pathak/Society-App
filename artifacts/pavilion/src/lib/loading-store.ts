// Tracks in-flight requests made through the hand-written apiGet/apiPost/apiPatch helpers
// (api-fetch.ts) — the ones that bypass React Query's generated hooks and so wouldn't
// otherwise show up in useIsFetching()/useIsMutating(). GlobalLoadingBar combines both
// sources so a loader shows up no matter which fetch path a page happens to use.
type Listener = () => void;

let pendingCount = 0;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function startManualRequest() {
  pendingCount += 1;
  emit();
}

export function endManualRequest() {
  pendingCount = Math.max(0, pendingCount - 1);
  emit();
}

export function subscribeManualRequests(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasPendingManualRequests() {
  return pendingCount > 0;
}
