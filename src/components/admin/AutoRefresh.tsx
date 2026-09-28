"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Aktualisiert die Seite periodisch im Hintergrund (Server Component neu
 * abrufen), damit ein Tablet, das dauerhaft am Empfang liegt, den
 * Tischstatus ohne manuelles Neuladen aktuell hält. Pausiert, wenn der
 * Tab/das Fenster nicht sichtbar ist, um keine unnötigen Anfragen zu
 * verursachen.
 */
export function AutoRefresh({ intervalMs = 45_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
