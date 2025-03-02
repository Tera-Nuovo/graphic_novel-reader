import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          © 2025 Manga Reader. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="text-sm text-muted-foreground underline underline-offset-4">
            Terms
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground underline underline-offset-4">
            Privacy
          </Link>
          <Link href="/contact" className="text-sm text-muted-foreground underline underline-offset-4">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}

