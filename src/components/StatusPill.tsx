import clsx from "clsx";
import { statusMeta, type DisplayStatus } from "./TableGraphic";

export function StatusPill({
  status,
  className,
}: {
  status: DisplayStatus;
  className?: string;
}) {
  const meta = statusMeta(status);
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
        meta.fill,
        className,
      )}
      style={{ color: `var(--color-status-${statusKey(status)})` }}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

function statusKey(status: DisplayStatus) {
  switch (status) {
    case "FREI":
      return "free";
    case "RESERVIERT":
      return "reserved";
    case "BESETZT":
      return "occupied";
    case "GESPERRT":
      return "locked";
  }
}
