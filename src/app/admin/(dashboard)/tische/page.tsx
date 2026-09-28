import { getAllTablesSorted } from "@/lib/adminData";
import { TableConfigList } from "@/components/admin/TableConfigList";
import { MAX_TABLES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function TischeConfigPage() {
  const tables = await getAllTablesSorted();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-brand-navy sm:text-3xl">
          Tische verwalten
        </h1>
        <p className="text-brand-navy/60">
          Piazza 106 verwaltet maximal {MAX_TABLES} Tische. Nummer, Sitzplätze und Aktiv-Status
          können hier angepasst werden.
        </p>
      </div>
      <TableConfigList tables={tables} />
    </div>
  );
}
