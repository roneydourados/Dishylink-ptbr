// Latency detail: a glider switch between the live window (chart + distribution)
// and the persisted quality score/grade history.

import { useState } from "react";
import type { TelemetrySample } from "@core/telemetry";
import { StatDetailPanel, type StatDetail } from "./StatDetailPanel";
import { LatencyQualityPanel } from "./LatencyQualityPanel";
import { SegmentedControl } from "../ui/segmented-control";

type LatencyView = "live" | "quality";

const VIEW_TABS = [
  { label: "Ao vivo", value: "live" as const },
  { label: "Qualidade", value: "quality" as const },
];

export function LatencyDetailPanel({
  detail,
  samples,
}: {
  detail: StatDetail;
  samples: TelemetrySample[];
}) {
  const [view, setView] = useState<LatencyView>("live");

  return (
    <div>
      <SegmentedControl
        options={VIEW_TABS}
        value={view}
        onChange={setView}
        label='Visão de latência'
        variant='glider'
        className='mb-1'
      />
      {view === "live" ? (
        <StatDetailPanel detail={detail} samples={samples} />
      ) : (
        <LatencyQualityPanel />
      )}
    </div>
  );
}
