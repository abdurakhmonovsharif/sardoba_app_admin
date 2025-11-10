export function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
      {label}
    </div>
  );
}
