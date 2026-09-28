import Link from "next/link";

/** Gemeinsamer Kopfbereich für alle öffentlichen (nicht-Admin) Seiten. */
export function SiteHeader() {
  return (
    <header className="w-full bg-brand-brown text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="font-display text-xl font-semibold tracking-wide">
          Piazza <span className="text-brand-cream-dark">106</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-white/70">
          <Link href="/meine-reservationen" className="hover:text-white">
            Meine Reservation
          </Link>
          <Link href="/admin/login" className="hover:text-white">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
