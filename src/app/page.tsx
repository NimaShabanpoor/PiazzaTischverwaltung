import Link from "next/link";
import { CalendarCheck, Clock, MapPin, Phone, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SiteHeader } from "@/components/SiteHeader";
import { RESTAURANT_INFO, OPENING_TIME, CLOSING_TIME } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-brand-teal text-white">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
            <p className="mb-3 font-semibold tracking-wide text-brand-cream-dark">
              {RESTAURANT_INFO.name} · {RESTAURANT_INFO.city}
            </p>
            <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
              Mediterranes Flair, gutes Essen &amp; ein Tisch, der auf Sie wartet.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/85">
              Reservieren Sie in wenigen Schritten online Ihren Tisch – einfach
              Datum, Uhrzeit und Personenzahl wählen und direkt bestätigen.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/reservieren">
                <Button size="lg" className="shadow-lg shadow-black/10">
                  <CalendarCheck size={20} />
                  Tisch reservieren
                </Button>
              </Link>
            </div>
          </div>
          <div
            aria-hidden
            className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-brand-turquoise/30 sm:h-80 sm:w-80"
          />
        </section>

        <section className="mx-auto grid max-w-5xl gap-6 px-5 py-14 sm:grid-cols-3 sm:px-8">
          <InfoCard
            icon={<Clock size={22} />}
            title="Öffnungszeiten"
            lines={[`Täglich ${OPENING_TIME} – ${CLOSING_TIME} Uhr`]}
          />
          <InfoCard
            icon={<MapPin size={22} />}
            title="Adresse"
            lines={[RESTAURANT_INFO.addressLine]}
          />
          <InfoCard
            icon={<Phone size={22} />}
            title="Kontakt"
            lines={[RESTAURANT_INFO.phone, RESTAURANT_INFO.email]}
          />
        </section>

        <section className="bg-brand-cream-dark/40">
          <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              So einfach geht&apos;s
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-4">
              {[
                "Datum & Uhrzeit wählen",
                "Personenzahl angeben",
                "Freien Tisch auswählen",
                "Kontaktdaten & bestätigen",
              ].map((step, i) => (
                <div key={step} className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange font-display font-semibold text-white">
                    {i + 1}
                  </div>
                  <p className="font-medium text-brand-navy">{step}</p>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Link href="/reservieren">
                <Button variant="secondary" size="lg">
                  <UtensilsCrossed size={20} />
                  Jetzt Tisch reservieren
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-brand-brown-dark py-8 text-center text-sm text-white/70">
        © {new Date().getFullYear()} {RESTAURANT_INFO.name}, {RESTAURANT_INFO.city}
        {/* Bewusst unauffällig: Der Admin-Zugang ist nur für den Chef gedacht. */}
        <Link
          href="/admin/login"
          className="ml-3 text-xs text-white/25 hover:text-white/60"
        >
          Admin
        </Link>
      </footer>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  lines,
}: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-2xl border border-brand-cream-dark bg-white p-5">
      <div className="mb-2 flex items-center gap-2 text-brand-orange">
        {icon}
        <h3 className="font-display text-lg font-semibold text-brand-navy">{title}</h3>
      </div>
      {lines.map((line) => (
        <p key={line} className="text-brand-navy/70">
          {line}
        </p>
      ))}
    </div>
  );
}
