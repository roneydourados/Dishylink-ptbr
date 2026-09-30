// Data usage panel: self-measured download/upload volume from the historian,
// in the layout of the Starlink account page's usage chart — headline GB,
// range tabs, stacked down/up bars. Clearly labeled as measured by Starlink Monitor Br
// (Starlink's own billing meter is cloud-side and not exposed locally).

import { useState } from "react";
import { useDataUsage, type UsageBucket } from "../../hooks/useDataUsage";
import type { EnergyRange } from "../../hooks/useEnergyHistory";
import { formatGigabytes } from "../../lib/format";
import { RangeBars, type RangeBarColumn } from "../shared/RangeBarChart";
import { RANGE_TABS, bucketLabel } from "../shared/rangeTabs";
import { SegmentedControl } from "../ui/segmented-control";
import { Callout } from "../ui/callout";
import { Explainer } from "../ui/explainer";
import { FigureRow } from "../ui/figure-row";
import { DeviceUsageList } from "./DeviceUsageList";
import { CloudDataUsage } from "./CloudDataUsage";

type UsageSource = "local" | "cloud";

const SOURCE_TABS = [
  { label: "Sessão local", value: "local" as const },
  { label: "Faturamento Starlink", value: "cloud" as const },
];

/** The figure with its unit, for the places that render them as one string. */
function withUnit(gigabytes: number): string {
  const { value, unit } = formatGigabytes(gigabytes);
  return `${value} ${unit}`;
}

function UsageBars({ buckets, range }: { buckets: UsageBucket[]; range: EnergyRange }) {
  const totalOf = (bucket: UsageBucket) => (bucket.downGB ?? 0) + (bucket.upGB ?? 0);
  const maxTotalGB = Math.max(...buckets.map(totalOf), 1e-9);
  const columns: RangeBarColumn[] = buckets.map((bucket) => {
    const missing = bucket.downGB === null || bucket.upGB === null;
    const total = totalOf(bucket);
    const when = bucketLabel(bucket.t, range);
    return {
      key: bucket.t,
      label: when,
      title: missing
        ? `${when} · sem dados — o gravador de histórico não estava em execução`
        : `${when} · ↓${withUnit(bucket.downGB!)} · ↑${withUnit(bucket.upGB!)}`,
      bar: missing ? (
        // An empty slot, not a zero one: mark the hole rather than draw a
        // bar claiming no traffic passed.
        <div
          style={{ height: "100%", width: "100%", background: "var(--ink-muted)", opacity: 0.06 }}
        />
      ) : (
        <div
          className='flex min-h-0.5 w-full flex-col overflow-hidden rounded-t-[3px]'
          style={{ height: `${(total / maxTotalGB) * 100}%` }}
        >
          <div
            className='min-h-0 bg-chart-warm'
            style={{ height: `${((bucket.upGB ?? 0) / Math.max(total, 1e-9)) * 100}%` }}
          />
          <div className='bg-chart-ink opacity-75' style={{ flex: 1 }} />
        </div>
      ),
    };
  });
  return (
    <RangeBars
      columns={columns}
      range={range}
      heightPx={150}
      yAxis={{ max: maxTotalGB, format: (v) => withUnit(v) }}
    />
  );
}

export function DataUsagePanel() {
  const [source, setSource] = useState<UsageSource>("local");

  return (
    <div>
      <SegmentedControl
        options={SOURCE_TABS}
        value={source}
        onChange={setSource}
        label='Fonte do uso de dados'
        variant='glider'
        className='mb-1'
      />
      {source === "local" ? <LocalDataUsage /> : <CloudDataUsage active={source === "cloud"} />}
    </div>
  );
}

function LocalDataUsage() {
  const [range, setRange] = useState<EnergyRange>("today");
  const { data, unavailable } = useDataUsage(range, true);
  const coveragePct = data ? Math.round(data.coverage.fraction * 100) : 0;

  if (unavailable) {
    return (
      <Callout className='mt-2.5'>
        O uso de dados precisa do gravador de histórico em execução. Inicie com{" "}
        <code>npm run historian</code> e o Starlink Monitor Br passará a medir o tráfego a partir de agora.
      </Callout>
    );
  }

  return (
    <div>
      <FigureRow
        figures={[
          {
            label: "↓ Download",
            value: data ? formatGigabytes(data.totalDownGB).value : "—",
            unit: data ? formatGigabytes(data.totalDownGB).unit : "GB",
          },
          {
            label: "↑ Upload",
            value: data ? formatGigabytes(data.totalUpGB).value : "—",
            unit: data ? formatGigabytes(data.totalUpGB).unit : "GB",
          },
          {
            label: "Total",
            value: data ? formatGigabytes(data.totalDownGB + data.totalUpGB).value : "—",
            unit: data ? formatGigabytes(data.totalDownGB + data.totalUpGB).unit : "GB",
          },
        ]}
      />
      <SegmentedControl
        options={RANGE_TABS}
        value={range}
        onChange={setRange}
        label='Período do uso de dados'
        className='mb-2.5'
      />

      {data && <UsageBars buckets={data.buckets} range={range} />}
      {data && (
        <div className='mt-0.5 text-[12px] font-medium text-muted-foreground'>
          coletado {coveragePct}% deste período
          {coveragePct < 95 && " — os totais cobrem apenas o tempo em que o gravador estava em execução"}
        </div>
      )}

      <Explainer title='Como isso é medido?'>
        O Starlink Monitor Br integra a telemetria de vazão por segundo da própria antena em volume por
        minuto, nesta máquina. Ele acompanha seu tráfego real a partir do momento em que o
        gravador de histórico foi iniciado — não é o medidor de faturamento da Starlink, que fica
        na nuvem deles e conta em UTC.
      </Explainer>

      <DeviceUsageList />
    </div>
  );
}
