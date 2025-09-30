import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto max-w-6xl px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} FormKit, Inc.</p>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="#" className="text-muted-foreground hover:text-foreground">
            Privacy
          </Link>
          <Link href="#" className="text-muted-foreground hover:text-foreground">
            Terms
          </Link>
          <Link href="#" className="text-muted-foreground hover:text-foreground">
            Status
          </Link>
        </nav>
      </div>
    </footer>
  )
}
