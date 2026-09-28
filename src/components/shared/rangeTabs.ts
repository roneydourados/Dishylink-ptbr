// The ranges the bar chart offers, and how a bucket's timestamp is labelled at
// each one. Held apart from the chart so the panels can build their tab strip
// and read labels without importing the chart itself.

import type { EnergyRange } from "../../hooks/useEnergyHistory";

export const RANGE_TABS: { label: string; value: EnergyRange }[] = [
  { label: "1H", value: "1h" },
  { label: "6H", value: "6h" },
  { label: "12H", value: "12h" },
  { label: "Hoje", value: "today" },
  { label: "Dia", value: "day" },
  { label: "Semana", value: "week" },
  { label: "Mês", value: "month" },
];

/** Clock time for sub-day ranges, date for day/week, month name for month. */
export function bucketLabel(epochSeconds: number, range: EnergyRange): string {
  const date = new Date(epochSeconds * 1000);
  if (range === "month") return date.toLocaleDateString("pt-BR", { month: "short" }); // jul.
  if (range === "day" || range === "week") {
    return date.toLocaleDateString("pt-BR", { month: "numeric", day: "numeric" });
  }
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
