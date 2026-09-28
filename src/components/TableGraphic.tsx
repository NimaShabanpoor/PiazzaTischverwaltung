import clsx from "clsx";

export type DisplayStatus = "FREI" | "RESERVIERT" | "BESETZT" | "GESPERRT";

const STATUS_STYLES: Record<
  DisplayStatus,
  { fill: string; ring: string; chair: string; label: string; emoji: string }
> = {
  FREI: {
    fill: "fill-status-free-bg",
    ring: "stroke-status-free",
    chair: "fill-status-free",
    label: "Frei",
    emoji: "🟢",
  },
  RESERVIERT: {
    fill: "fill-status-reserved-bg",
    ring: "stroke-status-reserved",
    chair: "fill-status-reserved",
    label: "Reserviert",
    emoji: "🔴",
  },
  BESETZT: {
    fill: "fill-status-occupied-bg",
    ring: "stroke-status-occupied",
    chair: "fill-status-occupied",
    label: "Besetzt",
    emoji: "🟠",
  },
  GESPERRT: {
    fill: "fill-status-locked-bg",
    ring: "stroke-status-locked",
    chair: "fill-status-locked",
    label: "Gesperrt",
    emoji: "⚪",
  },
};

export function statusMeta(status: DisplayStatus) {
  return STATUS_STYLES[status];
}

/**
 * Grafische Darstellung eines Tisches: ovale Tischplatte plus Stühle
 * (Anzahl = Sitzplätze), eingefärbt nach Status.
 */
export function TableGraphic({
  seats,
  status,
  number,
  size = 96,
  className,
}: {
  seats: number;
  status: DisplayStatus;
  number: number;
  size?: number;
  className?: string;
}) {
  const style = STATUS_STYLES[status];
  const center = 50;
  const chairCount = Math.max(1, Math.min(seats, 10));
  const chairs = Array.from({ length: chairCount }, (_, i) => {
    const angle = (2 * Math.PI * i) / chairCount - Math.PI / 2;
    const rx = 38;
    const ry = 38;
    const x = center + rx * Math.cos(angle);
    const y = center + ry * Math.sin(angle);
    return { x, y };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={clsx("shrink-0", className)}
      role="img"
      aria-label={`Tisch ${number}, ${seats} Plätze, Status ${style.label}`}
    >
      {chairs.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={6.5} className={style.chair} />
      ))}
      <circle
        cx={center}
        cy={center}
        r={24}
        strokeWidth={3}
        className={clsx(style.fill, style.ring)}
      />
      <text
        x={center}
        y={center + 5}
        textAnchor="middle"
        className="fill-brand-navy font-display font-semibold"
        fontSize={18}
      >
        {number}
      </text>
    </svg>
  );
}
