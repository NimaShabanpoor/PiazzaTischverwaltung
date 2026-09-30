import {
  LayoutGrid,
  LogOut,
  Table2,
  CalendarDays,
  CalendarOff,
  BarChart3,
  Inbox,
} from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/adminAuth";
import { countOpenGroupRequests } from "@/lib/adminData";
import { AdminNavLink } from "@/components/admin/AdminNavLink";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, openRequests] = await Promise.all([
    getAdminSession(),
    countOpenGroupRequests(),
  ]);

  return (
    <div className="min-h-screen bg-brand-cream">
      <header className="sticky top-0 z-30 border-b border-brand-cream-dark bg-brand-brown text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold tracking-wide">
              Piazza 106
            </span>
            <span className="hidden text-sm text-white/60 sm:inline">Admin</span>
          </div>

          <nav className="flex flex-1 flex-wrap items-center justify-center gap-1 sm:gap-2">
            <AdminNavLink href="/admin" icon={<LayoutGrid size={18} />} label="Tischübersicht" />
            <AdminNavLink
              href="/admin/reservierungen"
              icon={<CalendarDays size={18} />}
              label="Tagesübersicht"
            />
            <AdminNavLink
              href="/admin/anfragen"
              icon={<Inbox size={18} />}
              label="Anfragen"
              badge={openRequests}
            />
            <AdminNavLink
              href="/admin/schliesstage"
              icon={<CalendarOff size={18} />}
              label="Schliesstage"
            />
            <AdminNavLink href="/admin/tische" icon={<Table2 size={18} />} label="Tische" />
            <AdminNavLink
              href="/admin/statistik"
              icon={<BarChart3 size={18} />}
              label="Statistik"
            />
          </nav>

          <form action={logoutAction} className="flex items-center gap-2">
            {session && (
              <span className="hidden text-sm text-white/60 md:inline">
                {session.username}
              </span>
            )}
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20 cursor-pointer"
            >
              <LogOut size={16} />
              Abmelden
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
