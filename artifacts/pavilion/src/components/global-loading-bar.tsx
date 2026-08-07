import { useSyncExternalStore } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { subscribeManualRequests, hasPendingManualRequests } from "@/lib/loading-store";

// Mounted once in Layout so every page gets a loading indicator automatically — combines
// React Query's built-in in-flight tracking (covers the generated hooks most pages use)
// with the manual-request counter in loading-store.ts (covers apiGet/apiPost/apiPatch calls
// that bypass React Query, e.g. signup verification, the admin panel, chat).
export function GlobalLoadingBar() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const hasManualRequests = useSyncExternalStore(subscribeManualRequests, hasPendingManualRequests);

  const isLoading = isFetching > 0 || isMutating > 0 || hasManualRequests;

  if (!isLoading) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-1 bg-primary animate-pulse"
      role="status"
      aria-label="Loading"
    />
  );
}
