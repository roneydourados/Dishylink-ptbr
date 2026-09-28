// Dish thermal alerts, in two halves.
//
// The dish reports thermal state as live booleans on get_status → alerts and
// keeps no history of its own: once a flag clears, the episode is gone. The
// historian watches for the edges and writes them to a durable log, so the
// event list survives a reload and covers the hours no browser was open — this
// hook just reads that log back. Notifications come off the live status
// instead, since those only mean anything while a tab is actually open.
//
// There is no dish temperature to pair with these: the numeric sensors
// (modem_asic_temp, tx_if_temp) live on TransceiverGetStatus, which this
// firmware answers with Unimplemented. The flags are the whole signal.

import { useEffect, useMemo, useState } from "react";
import { useNow } from "./useNow";
import type { OutageEvent } from "@core/telemetry";
import { apiRequest } from "../lib/apiHost";

interface ThermalAlertSpec {
  /** Key on `alerts`, as emitted by the protobuf JSON mapping. */
  alertKey: string;
  cause: string;
  severity: OutageEvent["severity"];
  onsetTitle: string;
  onsetBody: string;
  clearedTitle: string;
  clearedBody: string;
}

const THERMAL_ALERTS: ThermalAlertSpec[] = [
  {
    alertKey: "thermalShutdown",
    cause: "desligamento térmico",
    severity: "critical",
    onsetTitle: "Antena desligada por temperatura",
    onsetBody:
      "A antena se desligou para evitar superaquecimento. O serviço fica offline até esfriar.",
    clearedTitle: "Desligamento térmico da antena encerrado",
    clearedBody: "A antena esfriou o bastante para voltar ao ar.",
  },
  {
    alertKey: "thermalThrottle",
    cause: "limitação térmica",
    severity: "warning",
    onsetTitle: "Antena com limitação térmica",
    onsetBody:
      "A antena está quente e limitando o desempenho para esfriar. Espere velocidades reduzidas.",
    clearedTitle: "Limitação térmica da antena encerrada",
    clearedBody: "A antena esfriou e voltou ao desempenho total.",
  },
  {
    alertKey: "powerSupplyThermalThrottle",
    cause: "limitação térmica da fonte",
    severity: "warning",
    onsetTitle: "Fonte com limitação térmica",
    onsetBody:
      "A fonte da antena está quente e limitando a saída. Verifique a ventilação ao redor.",
    clearedTitle: "Limitação térmica da fonte encerrada",
    clearedBody: "A fonte da antena voltou à temperatura normal.",
  },
];

const SPEC_BY_ALERT_KEY = new Map(THERMAL_ALERTS.map((spec) => [spec.alertKey, spec]));
const REFRESH_MS = 30_000;

interface ThermalEpisodeJson {
  alertKey: string;
  startMs: number;
  endMs: number | null;
}

/**
 * Thermal episodes from the historian's durable log, shaped as OutageEvents for
 * the events log. Empty when the historian isn't running.
 */
export function useThermalEvents(): OutageEvent[] {
  const [episodes, setEpisodes] = useState<ThermalEpisodeJson[]>([]);
  // An episode still running has no end, so its duration is measured against now
  // and grows while it runs. Taken from the ticking clock so it actually advances
  // on screen; read straight from Date.now() it would sit at whatever it was when
  // something unrelated last caused a render. Durations show seconds, so it ticks
  // every second.
  const nowMs = useNow();

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      try {
        const response = await apiRequest("/api/thermal", { signal: AbortSignal.timeout(4_000) });
        if (!response.ok) return;
        const body = (await response.json()) as { episodes?: ThermalEpisodeJson[] };
        if (!disposed) setEpisodes(body.episodes ?? []);
      } catch {
        // historian down: the dish's own events still populate the log
      }
    };
    load();
    const timerId = window.setInterval(load, REFRESH_MS);
    return () => {
      disposed = true;
      window.clearInterval(timerId);
    };
  }, []);

  return useMemo(() => {
    return episodes.flatMap((episode) => {
      const spec = SPEC_BY_ALERT_KEY.get(episode.alertKey);
      if (!spec) return [];
      const isOngoing = episode.endMs === null;
      return [
        {
          startMs: episode.startMs,
          durationMs: (episode.endMs ?? nowMs) - episode.startMs,
          cause: isOngoing ? `${spec.cause} (ongoing)` : spec.cause,
          severity: spec.severity,
        },
      ];
    });
  }, [episodes, nowMs]);
}
