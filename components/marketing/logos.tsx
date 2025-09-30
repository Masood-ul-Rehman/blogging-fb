export function Logos() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 items-center gap-6 opacity-80">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-10 bg-muted rounded-md" aria-hidden="true" />
      ))}
      <span className="sr-only">Customer logos</span>
    </div>
  )
}
