// The Alignment panel: a verdict line, the two instruments, and the numbers
// behind them. The math is SpaceX's own (alignmentMath.ts) and the dials are
// ported 1:1 from their web app (AlignmentInstruments.tsx); what lives here is
// the panel that arranges them.

import type { DishStatusJson } from "@core/dishClient";
import {
  formatActuatorState,
  formatAttitudeState,
  formatHasActuators,
  formatRelativeTime,
} from "../../lib/format";
import { Callout } from "../ui/callout";
import { Explainer } from "../ui/explainer";
import { FactColumn, FactColumns, FactRow } from "../ui/fact-row";
import { RotationInstrument, TiltInstrument } from "./AlignmentInstruments";
import { computeAlignment, SEPARATION_LIMIT_DEG, type AlignmentReading } from "./alignmentMath";

/** Green inside SpaceX's separation limit, warm outside it. */
const adjustmentColor = (errorDeg: number) =>
  Math.abs(errorDeg) < SEPARATION_LIMIT_DEG ? "var(--status-good)" : "var(--chart-warm)";

/** The one-line verdict, coloured by how sure we are of it. A stale reading
 *  supersedes the alignment verdict: a frozen "aligned" must not read as live. */
function AlignmentVerdict({
  reading,
  stale,
  lastStatusAtMs,
}: {
  reading: AlignmentReading;
  stale: boolean;
  lastStatusAtMs: number | null;
}) {
  return (
    <div
      className='text-[11.5px] font-medium text-muted-foreground'
      style={{
        color: stale
          ? "var(--status-critical)"
          : reading.isAligned
            ? "var(--status-good)"
            : reading.isValid
              ? "var(--chart-warm)"
              : "var(--ink-muted)",
        fontWeight: 600,
        fontSize: 13.5,
      }}
    >
      {stale
        ? `Antena sem resposta — mostrando a última leitura${lastStatusAtMs ? ` de ${formatRelativeTime(lastStatusAtMs)}` : ""}.`
        : !reading.isValid
          ? "Filtro de atitude ainda não pronto — os dados de alinhamento estão estabilizando."
          : reading.isAligned
            ? "Starlink alinhada — apontando na direção correta."
            : "Starlink desalinhada — ajuste a antena em direção à cunha."}
    </div>
  );
}

/** The figures the dials are drawn from, plus the GPS/attitude context that
 *  explains why a reading might not be trustworthy yet. */
function AlignmentFacts({
  status,
  reading,
}: {
  status: DishStatusJson;
  reading: AlignmentReading;
}) {
  const stats = status.alignmentStats;
  // Two columns matching the two dials above: rotation/azimuth on the left,
  // tilt/elevation on the right. Each column holds its own rows, so one can gain
  // or lose a row without shifting the other.
  return (
    <FactColumns>
      {/* Rotation — the left dial */}
      <FactColumn>
        <FactRow
          label='Rotação atual'
          hint='A rotação atual (azimute do boresight) é a direção da bússola para onde a antena está apontando de fato, medida no sentido horário a partir do Norte (0° a 360°).'
        >
          <span className='font-mono tabular-nums'>{reading.boresightAzimuthDeg.toFixed(1)}°</span>
        </FactRow>
        {/* An amount and a direction per axis, so the panel says what to do and
            not only what is. Both are the dish's own current-minus-target. */}
        <FactRow
          label='Recomendação de rotação'
          hint='Quanto girar a antena, e para qual lado, vista de cima. ↺ é anti-horário, ↻ é horário.'
        >
          <span
            className='font-mono tabular-nums'
            style={{ color: adjustmentColor(reading.azimuthErrorDeg) }}
          >
            {Math.abs(reading.azimuthErrorDeg).toFixed(2)}°{" "}
            {reading.azimuthErrorDeg > 0 ? "↺" : "↻"}
          </span>
        </FactRow>
        <FactRow
          label='Azimute alvo'
          hint='A direção da bússola para onde a antena quer apontar, no sentido horário a partir do Norte, e até onde de cada lado ainda conta como alinhada.'
        >
          <span className='font-mono tabular-nums'>
            {reading.desiredAzimuthDeg.toFixed(1)}° ±{reading.azimuthToleranceDeg.toFixed(0)}°
          </span>
        </FactRow>
        <FactRow
          label='Erro de boresight'
          hint={`O erro de boresight (erro de apontamento) é o quanto a antena está apontando longe de onde quer apontar, em um único ângulo. Abaixo de ${SEPARATION_LIMIT_DEG}° conta como alinhada.`}
        >
          <span
            className='font-mono tabular-nums'
            style={{ color: adjustmentColor(reading.boresightErrorDeg) }}
          >
            {reading.boresightErrorDeg.toFixed(2)}° · ideal &lt;{SEPARATION_LIMIT_DEG}°
          </span>
        </FactRow>
        <FactRow
          label='Incerteza de atitude'
          hint='Quão certa a antena está da própria orientação. Quanto menor, melhor — um valor alto significa que as leituras acima ainda estão estabilizando.'
        >
          <span className='font-mono tabular-nums'>
            ±{(stats?.attitudeUncertaintyDeg ?? 0).toFixed(2)}°
          </span>
        </FactRow>
        <FactRow
          label='Estado da estimativa de atitude'
          hint='Se a antena já terminou de calcular a própria orientação. Converged significa que as figuras de alinhamento podem ser confiáveis.'
        >
          <span className='font-mono tabular-nums'>
            {formatAttitudeState(stats?.attitudeEstimationState) ?? "—"}
          </span>
        </FactRow>
        <FactRow
          label='Satélites à vista (GPS)'
          hint='Satélites GPS que a antena consegue ver agora. Ela usa esses para fixar a própria posição e orientação, não para o link de internet.'
        >
          <span className='font-mono tabular-nums'>
            {status.gpsStats?.gpsValid ? `${status.gpsStats.gpsSats ?? 0} satélites` : "sem fixação"}
          </span>
        </FactRow>
      </FactColumn>
      {/* Tilt — the right dial */}
      <FactColumn>
        <FactRow
          label='Inclinação atual'
          hint='A inclinação atual (ângulo de tilt) é o ângulo físico da placa da antena em relação ao plano. Plano é 0°, e quanto mais íngreme a placa, mais baixo ela aponta.'
        >
          <span className='font-mono tabular-nums'>{reading.tiltAngleDeg.toFixed(1)}°</span>
        </FactRow>
        <FactRow
          label='Recomendação de inclinação'
          hint='Quanto reajustar a antena para cima ou para baixo, e em qual sentido. Para baixo significa que a antena está apontando alto demais; incline mais a placa para baixar o apontamento.'
        >
          <span
            className='font-mono tabular-nums'
            style={{ color: adjustmentColor(reading.elevationErrorDeg) }}
          >
            {Math.abs(reading.elevationErrorDeg).toFixed(2)}°{" "}
            {reading.elevationErrorDeg > 0 ? "↓" : "↑"}
          </span>
        </FactRow>
        <FactRow
          label='Elevação do boresight'
          hint='A elevação do boresight é o quanto acima do horizonte a antena está apontando de fato, onde 0° é ao nível do horizonte e 90° é direto para cima.'
        >
          <span className='font-mono tabular-nums'>
            {reading.boresightElevationDeg.toFixed(1)}°
          </span>
        </FactRow>
        {/* The dish's own reported target — NOT `reading.targetElevationDeg`,
            which computeAlignment clamps to the band floor (min(70, desired)) for
            the alignment test. On this dish that clamp turns 76.0° into 70.0°. */}
        <FactRow
          label='Elevação alvo'
          hint='A elevação alvo é o ângulo acima do horizonte para onde esta antena quer apontar, calculado para a sua localização.'
        >
          <span className='font-mono tabular-nums'>{reading.desiredElevationDeg.toFixed(1)}°</span>
        </FactRow>
        {/* Split off Target elevation: that figure is this dish's own target, this
            one is SpaceX's fixed tolerance around it. Same span the Tilt dial
            fills as its grey wedge. */}
        <FactRow
          label='Faixa aceitável de elevação'
          hint='A faixa aceitável de elevação é o intervalo de elevações que ainda conta como alinhada. É a cunha cinza desenhada no dial de Inclinação acima — enquanto a antena aponta dentro dela, o dial fica verde.'
        >
          <span className='font-mono tabular-nums'>
            {reading.lowerElevationLimitDeg.toFixed(0)}–{reading.upperElevationLimitDeg.toFixed(0)}°
          </span>
        </FactRow>
        <FactRow
          label='Tem atuadores'
          hint='Se a antena se orienta sozinha com motores. Sem eles, o apontamento é eletrônico e qualquer ajuste físico é feito à mão.'
        >
          <span className='font-mono tabular-nums'>
            {formatHasActuators(status.alignmentStats?.hasActuators ?? status.hasActuators)}
          </span>
        </FactRow>
        <FactRow
          label='Estado de atuação'
          hint='O que os motores da antena estão fazendo agora — parados, ou se movendo ativamente para uma nova posição.'
        >
          <span className='font-mono tabular-nums'>
            {formatActuatorState(stats?.actuatorState)}
          </span>
        </FactRow>
      </FactColumn>
    </FactColumns>
  );
}

export function AlignmentPanel({
  status,
  stale = false,
  lastStatusAtMs = null,
  onOpenSkyView,
}: {
  status: DishStatusJson | null;
  stale?: boolean;
  lastStatusAtMs?: number | null;
  onOpenSkyView?: () => void;
}) {
  // Null only on a cold start; after the first reading the dish going quiet keeps
  // the last status and is the `stale` case instead.
  if (!status) {
    return (
      <Callout tone='error'>
        Não foi possível alcançar a antena Starlink — o alinhamento precisa de uma leitura ao vivo.
        Isso atualiza sozinho quando a antena voltar a responder.
      </Callout>
    );
  }

  const reading = computeAlignment(status);

  return (
    <div>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
      >
        <AlignmentVerdict reading={reading} stale={stale} lastStatusAtMs={lastStatusAtMs} />
        {onOpenSkyView && (
          <button
            className='shrink-0 cursor-pointer border-0 bg-transparent p-0 font-sans text-[13px] font-semibold text-(--accent) transition-[color,opacity] duration-[120ms] hover:opacity-75'
            onClick={onOpenSkyView}
          >
            Vista ao vivo dos satélites ›
          </button>
        )}
      </div>

      <div className='my-3.5 flex gap-3.5 max-[720px]:flex-col'>
        <RotationInstrument reading={reading} />
        <TiltInstrument reading={reading} />
      </div>

      <AlignmentFacts status={status} reading={reading} />

      <div className='text-[11.5px] font-medium text-muted-foreground' style={{ marginTop: 12 }}>
        <Explainer title='Como ler isto'>
          A cunha mostra a direção de apontamento desejada ± tolerância. A placa da antena e a agulha
          laranja mostram para onde a antena está apontando de fato. Se a agulha está dentro da
          cunha, a antena está alinhada. Se está fora, ajuste a antena em direção à cunha. Os valores
          atualizam ao vivo a cada 2s
        </Explainer>
      </div>
    </div>
  );
}
