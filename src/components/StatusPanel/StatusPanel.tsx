interface StatusPanelProps {
  isLoading: boolean;
  error: string | null;
  loadingMessage?: string;
}

export function StatusPanel({
  isLoading,
  error,
  loadingMessage = "Loading project config...",
}: StatusPanelProps) {
  if (!isLoading && !error) {
    return null;
  }

  return (
    <div className="status-panel">{isLoading ? loadingMessage : error}</div>
  );
}
