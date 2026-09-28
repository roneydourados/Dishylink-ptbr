// The allowance, timer and membership controls, shared by every form that sets a
// limit, so a rule and the group it can become are never worded two ways.

import { useMemo, useState } from "react";
import {
  CalendarClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  GaugeIcon,
  InfoIcon,
  TimerIcon,
} from "lucide-react";
import { MAX_COUNTDOWN_MS, type MeterCycle } from "@core/dataMeter";
import { classifyDevice } from "../../../lib/deviceKind";
import { vendorForMac } from "../../../lib/macVendor";
import { DeviceTypeIcon } from "../../../assets/icons/DeviceTypeIcon";
import { Input } from "../../ui/input";
import { Slider } from "../../ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import {
  CYCLE_OPTIONS,
  MINUTE_MS,
  WEEKDAYS,
  ceilingFor,
  ceilingLabel,
  formatDuration,
  orderedCandidates,
  stepButtonClass,
  stepCeiling,
  stepDay,
  stepFor,
  type AllowanceDraft,
  type MemberCandidate,
  type RuleMode,
} from "./allowanceTerms";

export type { RuleMode };

const RULE_MODES: { mode: RuleMode; label: string; icon: typeof TimerIcon; detail: string }[] = [
  {
    mode: "limit",
    label: "Limite",
    icon: GaugeIcon,
    detail: "Pausa ao atingir uma quantidade de dados, e libera quando o ciclo reinicia.",
  },
  {
    mode: "schedule",
    label: "Agenda",
    icon: CalendarClockIcon,
    detail: "Pausa fora dos horários que você definir, em dias da semana ou datas.",
  },
  {
    mode: "timer",
    label: "Timer",
    icon: TimerIcon,
    detail: "Pausa quando a contagem regressiva acaba, a partir do momento em que você salva.",
  },
];

/** Sits beside a rule form's title, explaining what each of the three kinds does. */
export function RuleModesInfo() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type='button'
          aria-label='O que cada tipo de regra faz'
          className='grid size-5 shrink-0 translate-y-px cursor-help place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
        >
          <InfoIcon className='size-3.5' />
        </button>
      </TooltipTrigger>
      <TooltipContent side='bottom' align='start' className='max-w-64 space-y-1.5 text-left'>
        {RULE_MODES.map((option) => (
          <p key={option.mode}>
            <span className='font-semibold'>{option.label}:</span> {option.detail}
          </p>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

export function RuleModeToggle({
  mode,
  onChange,
}: {
  mode: RuleMode;
  onChange: (next: RuleMode) => void;
}) {
  return (
    <div className='flex items-center gap-1 rounded-full border border-border/70 p-0.5'>
      {RULE_MODES.map((option) => {
        const Icon = option.icon;
        const on = mode === option.mode;
        return (
          <button
            key={option.mode}
            type='button'
            onClick={() => onChange(option.mode)}
            aria-pressed={on}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${
              on
                ? "bg-[color-mix(in_srgb,var(--ink)_88%,var(--baseline))] text-[var(--baseline)]"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Icon className='size-3.5' />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const QUICK_DURATIONS_MIN = [30, 60, 120, 360, 720, 1440];

function CountdownFields({ draft }: { draft: AllowanceDraft }) {
  const { hoursText, setHoursText, minutesText, setMinutesText, countdownMs } = draft;
  const setTotal = (totalMinutes: number) => {
    const clamped = Math.min(24 * 60, Math.max(1, totalMinutes));
    setHoursText(String(Math.floor(clamped / 60)));
    setMinutesText(String(clamped % 60));
  };
  return (
    <div className='space-y-3'>
      <div className='grid grid-cols-2 gap-3'>
        <label className='space-y-1.5'>
          <span className='text-[12px] font-medium text-foreground'>Horas</span>
          <Input
            value={hoursText}
            inputMode='numeric'
            onChange={(event) => setHoursText(event.target.value.replace(/[^0-9]/g, ""))}
            onBlur={() => setHoursText(String(Math.min(24, Number(hoursText) || 0)))}
            className='tabular-nums'
          />
        </label>
        <label className='space-y-1.5'>
          <span className='text-[12px] font-medium text-foreground'>Minutos</span>
          <Input
            value={minutesText}
            inputMode='numeric'
            onChange={(event) => setMinutesText(event.target.value.replace(/[^0-9]/g, ""))}
            onBlur={() => setMinutesText(String(Math.min(59, Number(minutesText) || 0)))}
            className='tabular-nums'
          />
        </label>
      </div>
      <div className='flex flex-wrap gap-1.5'>
        {QUICK_DURATIONS_MIN.map((minutes) => (
          <button
            key={minutes}
            type='button'
            onClick={() => setTotal(minutes)}
            className='cursor-pointer rounded-full border border-border/70 px-2.5 py-1 text-[11.5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
          >
            {formatDuration(minutes * MINUTE_MS)}
          </button>
        ))}
      </div>
      {countdownMs !== undefined && countdownMs >= MAX_COUNTDOWN_MS && (
        <p className='text-[11.5px] text-muted-foreground'>
          A timer dura no máximo 24 horas. Use uma franquia para períodos maiores.
        </p>
      )}
    </div>
  );
}

/** Which devices this limit covers, and how an allowance is divided between
 *  them. More than one device makes it a group. */
export function AppliesToField({
  candidates,
  selected,
  onToggle,
  shared,
  onSharedChange,
  carriesAllowance,
  timer,
}: {
  candidates: MemberCandidate[];
  selected: string[];
  onToggle: (clientKey: string) => void;
  shared: boolean;
  onSharedChange: (next: boolean) => void;
  /** Sharing one allowance or giving each its own only means something when the
   *  rule sets an allowance, so without one the choice is not offered. */
  carriesAllowance: boolean;
  timer: boolean;
}) {
  // Open when the selection is not the single device a card opens with — a rule
  // written from the list starts with none, and a collapsed picker hides the one
  // thing it still needs.
  const [open, setOpen] = useState(selected.length !== 1);
  const summary =
    selected.length === 0
      ? "Escolher dispositivos"
      : selected.length === 1
        ? "Este dispositivo"
        : `${selected.length} dispositivos`;
  // The order holds still, not the array: the odometer mints a fresh list on its
  // own poll, so this recomputes and the sort is what keeps a row from moving
  // under the cursor.
  const rows = useMemo(() => orderedCandidates(candidates), [candidates]);
  return (
    <div className='space-y-1.5'>
      <div className='flex items-baseline justify-between'>
        <span className='text-[12px] font-medium text-foreground'>Aplica-se a</span>
        <button
          type='button'
          onClick={() => setOpen(!open)}
          className='cursor-pointer rounded-sm px-1 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
        >
          {summary}
          <ChevronDownIcon
            className={`ml-1 inline size-3 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {open && (
        <>
          <div className='thin-scroll max-h-52 space-y-0.5 overflow-y-auto rounded-lg border border-border/60 p-1'>
            {rows.map((candidate) => {
              const vendor = vendorForMac(candidate.macAddress);
              return (
                <label
                  key={candidate.clientKey}
                  className='flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-accent'
                >
                  <input
                    type='checkbox'
                    className='size-3.5 shrink-0 accent-[var(--ink)]'
                    checked={selected.includes(candidate.clientKey)}
                    onChange={() => onToggle(candidate.clientKey)}
                  />
                  <DeviceTypeIcon
                    kind={classifyDevice(candidate.name)}
                    size={18}
                    className='shrink-0 text-ink-secondary'
                  />
                  <span className='flex min-w-0 flex-col gap-px'>
                    <span className='truncate'>{candidate.name}</span>
                    {candidate.hasCounters === false ? (
                      <span className='truncate text-[11px] text-muted-foreground'>
                        {vendor ? `${vendor} · ` : ""}sem dados de uso — só horários
                      </span>
                    ) : (
                      vendor && (
                        <span className='truncate text-[11px] text-muted-foreground'>{vendor}</span>
                      )
                    )}
                  </span>
                  {candidate.active && (
                    <span className='ml-auto shrink-0 text-[10.5px] tracking-wide text-muted-foreground'>
                      ATIVO AGORA
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          {selected.length > 1 && carriesAllowance && (
            <div className='grid grid-cols-2 gap-2 pt-1'>
              <MemberModeChoice
                selected={!shared}
                onSelect={() => onSharedChange(false)}
                title='Cada um'
                detail='Cada dispositivo recebe a franquia completa sozinho.'
              />
              <MemberModeChoice
                selected={shared}
                onSelect={() => onSharedChange(true)}
                title='Compartilhada'
                detail='Uma franquia entre eles. Pausam juntos.'
              />
            </div>
          )}
          {selected.length > 1 && !carriesAllowance && (
            <p className='pt-1 text-[11.5px] text-muted-foreground'>
              {timer
                ? `Todos os ${selected.length} dispositivos começam e terminam no mesmo relógio.`
                : `Estes horários valem para todos os ${selected.length} dispositivos.`}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function MemberModeChoice({
  selected,
  onSelect,
  title,
  detail,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
}) {
  return (
    <button
      type='button'
      onClick={onSelect}
      aria-pressed={selected}
      className={`cursor-pointer rounded-lg border p-2.5 text-left transition-colors ${
        selected
          ? "border-[color-mix(in_srgb,var(--ink)_45%,transparent)] bg-[color-mix(in_srgb,var(--ink)_8%,transparent)]"
          : "border-border/60 hover:bg-accent"
      }`}
    >
      <span className='block text-[13px] font-medium text-foreground'>{title}</span>
      <span className='mt-0.5 block text-[11.5px] leading-snug text-muted-foreground'>
        {detail}
      </span>
    </button>
  );
}

export function AllowanceFields({ draft }: { draft: AllowanceDraft }) {
  const { allocationText, setAllocationText, ceiling, setCeiling, kind, billingDay } = draft;
  if (draft.timer) return <CountdownFields draft={draft} />;
  return (
    <>
      <div className='grid grid-cols-2 gap-3'>
        <label className='space-y-1.5'>
          <span className='text-[12px] font-medium text-foreground'>Franquia</span>
          <div className='relative'>
            <Input
              value={allocationText}
              inputMode='decimal'
              onChange={(event) => {
                setAllocationText(event.target.value);
                const typed = Number(event.target.value);
                if (Number.isFinite(typed) && typed > ceiling) setCeiling(ceilingFor(typed));
              }}
              className='pr-12 tabular-nums'
            />
            <span className='absolute inset-y-0 right-3 flex items-center text-[12px] text-muted-foreground'>
              GB
            </span>
          </div>
        </label>
        <div className='space-y-1.5'>
          <span className='text-[12px] font-medium text-foreground'>Reinicia</span>
          <Select value={kind} onValueChange={(next) => draft.setKind(next as MeterCycle["kind"])}>
            <SelectTrigger className='w-full text-[13px]' aria-label='Reinicia'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CYCLE_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.value === "billing" && billingDay === null}
                >
                  {option.value === "billing"
                    ? billingDay === null
                      ? "Faturamento Starlink (precisa da sua conta)"
                      : `Faturamento Starlink (${billingDay})`
                    : option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <Slider
          value={[Math.min(Number(allocationText) || 0, ceiling)]}
          max={ceiling}
          step={stepFor(ceiling)}
          onValueChange={([next]) => setAllocationText(String(next))}
          aria-label='Franquia em gigabytes'
        />
        <div className='flex shrink-0 flex-col items-center gap-0.5'>
          <button
            type='button'
            onClick={() => setCeiling(stepCeiling(ceiling, Number(allocationText) || 0, 1))}
            aria-label='Ampliar o controle deslizante'
            className={stepButtonClass}
          >
            <ChevronUpIcon className='size-3' />
          </button>
          <button
            type='button'
            onClick={() => setCeiling(stepCeiling(ceiling, Number(allocationText) || 0, 1))}
            title='Alterar até onde o controle deslizante vai'
            className='cursor-pointer rounded-sm px-1 text-[11.5px] leading-none tabular-nums text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
          >
            {ceilingLabel(ceiling)}
          </button>
          <button
            type='button'
            onClick={() => setCeiling(stepCeiling(ceiling, Number(allocationText) || 0, -1))}
            aria-label='Encurtar o controle deslizante'
            className={stepButtonClass}
          >
            <ChevronDownIcon className='size-3' />
          </button>
        </div>
      </div>

      {kind === "weekly" && (
        <div className='space-y-1.5'>
          <span className='text-[12px] font-medium text-foreground'>Reinicia em</span>
          <Select
            value={String(draft.weekday)}
            onValueChange={(next) => draft.setWeekday(Number(next))}
          >
            <SelectTrigger className='w-full text-[13px]' aria-label='Reinicia em'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((label, index) => (
                <SelectItem key={label} value={String(index)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {kind === "monthly" && (
        <label className='block space-y-1.5'>
          <span className='text-[12px] font-medium text-foreground'>Reinicia no dia</span>
          <div className='relative'>
            <Input
              value={draft.dayText}
              inputMode='numeric'
              onChange={(event) => draft.setDayText(event.target.value.replace(/[^0-9]/g, ""))}
              onBlur={() => draft.setDayText(String(draft.day))}
              className='pr-9 tabular-nums'
            />
            <div className='absolute inset-y-0 right-2 flex flex-col justify-center gap-0.5'>
              <button
                type='button'
                onClick={() => draft.setDayText(String(stepDay(draft.day, 1)))}
                aria-label='Mais tarde no mês'
                className={stepButtonClass}
              >
                <ChevronUpIcon className='size-3' />
              </button>
              <button
                type='button'
                onClick={() => draft.setDayText(String(stepDay(draft.day, -1)))}
                aria-label='Mais cedo no mês'
                className={stepButtonClass}
              >
                <ChevronDownIcon className='size-3' />
              </button>
            </div>
          </div>
        </label>
      )}
    </>
  );
}
