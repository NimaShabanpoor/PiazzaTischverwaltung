import Link from "next/link";
import { BellRing, ChevronRight } from "lucide-react";
import { listOpenRequests } from "@/lib/reservationRequests";
import { formatDateDeCH, toDateISO, toTimeHHmm } from "@/lib/time";

/**
 * Hinweis auf Online-Anfragen, die noch auf eine Entscheidung warten. Der Chef
 * kann sie hier direkt öffnen, ohne die Anfrage-Mail suchen zu müssen.
 */
export async function OpenRequestsBanner() {
  const requests = await listOpenRequests();
  if (requests.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border-2 border-status-occupied bg-status-occupied-bg p-4 sm:p-5">
      <p className="flex items-center gap-2 font-display text-lg font-semibold text-brand-navy">
        <BellRing size={20} className="shrink-0 text-status-occupied" />
        {requests.length === 1
          ? "1 Anfrage wartet auf Ihre Entscheidung"
          : `${requests.length} Anfragen warten auf Ihre Entscheidung`}
      </p>

      <ul className="mt-3 space-y-2">
        {requests.map((request) => (
          <li key={request.id}>
            <Link
              href={`/anfrage/${request.decisionToken}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 transition-colors hover:bg-brand-cream"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-brand-navy">
                  {request.customerName} · {request.partySize}{" "}
                  {request.partySize === 1 ? "Person" : "Personen"}
                </span>
                <span className="block text-sm text-brand-navy/60">
                  {formatDateDeCH(toDateISO(request.start))} · {toTimeHHmm(request.start)} –{" "}
                  {toTimeHHmm(request.end)} Uhr · Tisch {request.table.number}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-teal">
                Entscheiden
                <ChevronRight size={16} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
