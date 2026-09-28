// Dish configuration and maintenance — the Starlink half of the settings panel.

import { useState } from "react";
import { CheckIcon, InfoIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { Callout } from "@/components/ui/callout";
import { Loading } from "@/components/ui/loading";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { actionButton } from "@/components/ui/action-button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DishClient, DishStatusJson, SnowMeltMode } from "@core/dishClient";
import type { useDishSettings } from "../../hooks/useDishSettings";
import { AccountRequiredError } from "../../lib/dishConfigUpdate";
import { AccountRequiredNotice } from "../shared/AccountRequiredNotice";
import {
  DangerAction,
  SectionLabel,
  SettingRow,
  selectContentClass,
  selectItemClass,
  triggerClass,
} from "./settingsChrome";
import { formatClock12, localMinutesToUtcMinutes, utcMinutesToLocalMinutes } from "./sleepSchedule";
import { TimePicker } from "./TimePicker";
import { UPDATE_WINDOWS, updateWindowFor } from "./updateWindow";

const SNOW_MELT_LABEL: Record<SnowMeltMode, string> = {
  AUTO: "Automático",
  ALWAYS_ON: "Sempre ligado",
  ALWAYS_OFF: "Desligado",
};

const SNOW_MELT_DESCRIPTION: Record<SnowMeltMode, string> = {
  AUTO: "Detecta neve automaticamente e aquece quando necessário.",
  ALWAYS_ON:
    "Mantém aquecido para resistir melhor ao acúmulo de neve. Esta opção pode aumentar o consumo de energia.",
  ALWAYS_OFF: "Nunca usa energia extra para derreter neve.",
};

function SnowMeltOption({ mode }: { mode: SnowMeltMode }) {
  return (
    <SelectPrimitive.Item
      value={mode}
      className={cn(
        selectItemClass,
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-12 pl-2 outline-hidden select-none focus:bg-accent focus:text-accent-foreground",
      )}
    >
      <span className='absolute right-2 flex items-center gap-1.5'>
        <SelectPrimitive.ItemIndicator className='flex size-3.5 items-center justify-center'>
          <CheckIcon className='size-4' />
        </SelectPrimitive.ItemIndicator>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className='flex size-3.5 shrink-0 items-center justify-center text-muted-foreground'
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <InfoIcon className='size-3.5' />
            </span>
          </TooltipTrigger>
          <TooltipContent side='left' className='max-w-56'>
            {SNOW_MELT_DESCRIPTION[mode]}
          </TooltipContent>
        </Tooltip>
      </span>
      <SelectPrimitive.ItemText>{SNOW_MELT_LABEL[mode]}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export function StarlinkSettingsTab({
  settings,
  status,
  isMotorized,
  loadDish,
  onCopyDiagnostics,
}: {
  settings: ReturnType<typeof useDishSettings>;
  status: DishStatusJson | null;
  /** Mast-mounted hardware can stow; a fixed panel cannot. */
  isMotorized: boolean;
  loadDish: () => Promise<DishClient>;
  onCopyDiagnostics: () => Promise<"copied" | "failed">;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const config = settings.config;

  const sleepEnabled = Boolean(config?.powerSaveMode);
  const sleepStartLocal = utcMinutesToLocalMinutes(config?.powerSaveStartMinutes ?? 60);
  const sleepDurationMinutes = config?.powerSaveDurationMinutes ?? 360;
  const wakeLocal = (sleepStartLocal + sleepDurationMinutes) % 1440;
  const updateWindow = updateWindowFor(config?.swupdateRebootHour);

  // Every write is fire-and-forget with the failure swallowed: the hook already
  // surfaces `settings.error`, and a rejected promise here would be unhandled.
  const save = (patch: Parameters<typeof settings.save>[0]) =>
    void settings.save(patch).catch(() => {});

  return (
    <>
      {settings.loading && <Loading message='Lendo configuração da antena…' />}
      {/* Same Callout the Router tab uses for its failures — the two tabs are
          siblings and their errors must not read as two different apps. */}
      {settings.error && (
        <Callout tone='error'>
          {settings.error instanceof AccountRequiredError ? (
            <AccountRequiredNotice />
          ) : (
            settings.error.message
          )}
        </Callout>
      )}
      {config && (
        <>
          <SettingRow
            title='Derretimento de neve'
            caption='Aquece o painel para tirar a neve. Automático usa os sensores da própria antena.'
          >
            <Select
              value={config.snowMeltMode ?? "AUTO"}
              disabled={settings.saving}
              onValueChange={(mode) => save({ snowMeltMode: mode as SnowMeltMode })}
            >
              <SelectTrigger className={triggerClass} style={{ width: 118 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                {(Object.keys(SNOW_MELT_LABEL) as SnowMeltMode[]).map((mode) => (
                  <SnowMeltOption key={mode} mode={mode} />
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow
            title='Horário de sono'
            caption={
              sleepEnabled
                ? `A antena desliga diariamente às ${formatClock12(sleepStartLocal)} e liga às ${formatClock12(wakeLocal)}`
                : "Desliga a antena durante parte de cada dia"
            }
          >
            <Switch
              checked={sleepEnabled}
              disabled={settings.saving}
              onCheckedChange={(enabled) =>
                save(
                  enabled
                    ? {
                        powerSaveMode: true,
                        powerSaveStartMinutes:
                          config.powerSaveStartMinutes ?? localMinutesToUtcMinutes(60),
                        powerSaveDurationMinutes: config.powerSaveDurationMinutes || 360,
                      }
                    : { powerSaveMode: false },
                )
              }
            />
          </SettingRow>
          {sleepEnabled && (
            <div className='flex items-center justify-end gap-2 pb-[8px]'>
              <span className='mt-px block text-[12px] text-muted-foreground'>de</span>
              <TimePicker
                minutes={sleepStartLocal}
                disabled={settings.saving}
                onChange={(newStartLocal) =>
                  save({
                    powerSaveStartMinutes: localMinutesToUtcMinutes(newStartLocal),
                    powerSaveDurationMinutes: (wakeLocal - newStartLocal + 1440) % 1440 || 1440,
                  })
                }
              />
              <span className='mt-px block text-[12px] text-muted-foreground'>até</span>
              <TimePicker
                minutes={wakeLocal}
                disabled={settings.saving}
                onChange={(newWakeLocal) =>
                  save({
                    powerSaveDurationMinutes:
                      (newWakeLocal - sleepStartLocal + 1440) % 1440 || 1440,
                  })
                }
              />
            </div>
          )}

          {/* Four windows, not 24 hours: the dish reboots somewhere inside a
              six-hour band, which is why the official app offers exactly these
              and words them "around 3 AM · Between 12 AM and 6 AM". */}
          <SettingRow
            title='Atualizações de software'
            caption={`Reinícios da atualização ocorrem ${updateWindow.range.toLowerCase()}`}
          >
            <Select
              value={String(updateWindow.hour)}
              disabled={settings.saving}
              onValueChange={(hour) => save({ swupdateRebootHour: Number(hour) })}
            >
              <SelectTrigger className={triggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                {UPDATE_WINDOWS.map((window) => (
                  <SelectItem
                    key={window.hour}
                    value={String(window.hour)}
                    className={selectItemClass}
                  >
                    {window.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow title='Adiar atualizações' caption='Segura atualizações de firmware por até 3 dias'>
            <Switch
              checked={Boolean(config.swupdateThreeDayDeferralEnabled)}
              disabled={settings.saving}
              onCheckedChange={(enabled) => save({ swupdateThreeDayDeferralEnabled: enabled })}
            />
          </SettingRow>

          <SettingRow
            title='Dados de depuração'
            caption='Diagnósticos + status + config em JSON, para suporte ou relatos de bug'
          >
            <button
              className={actionButton("subtle")}
              onClick={() => {
                void onCopyDiagnostics().then((outcome) => {
                  setCopyState(outcome);
                  window.setTimeout(() => setCopyState("idle"), 2500);
                });
              }}
            >
              {copyState === "copied"
                ? "Copiado ✓"
                : copyState === "failed"
                  ? "Falha ao copiar"
                  : "Copiar"}
            </button>
          </SettingRow>

          <SectionLabel>Manutenção</SectionLabel>
          <DangerAction
            title='Redefinir mapa de obstrução'
            caption='Apaga o levantamento do céu aprendido — faça isso após mover a antena fisicamente. Leva horas para reaprender.'
            buttonLabel='Redefinir'
            confirmLabel='Sim, redefinir mapa'
            onRun={async () => {
              await (await loadDish()).clearObstructionMap();
              return "Mapa de obstrução limpo — o levantamento recomeça agora.";
            }}
          />
          <DangerAction
            title='Reiniciar Starlink'
            caption='A internet cai por ~2–3 minutos enquanto a antena reinicia'
            buttonLabel='Reiniciar'
            slideLabel='Deslize para reiniciar a antena'
            confirmLabel='Reiniciar antena'
            onRun={async () => {
              await (await loadDish()).reboot();
              return "Comando de reinício enviado — a antena está reiniciando.";
            }}
          />
          <DangerAction
            title='Restaurar fábrica do Starlink'
            caption='Apaga todas as configurações da antena para o estado de fábrica. Irreversível.'
            buttonLabel='Restaurar fábrica'
            slideLabel='Deslize para restaurar a fábrica da antena'
            confirmLabel='Restaurar fábrica da antena'
            warning='Só restaure de fábrica como último recurso ou quando a Starlink recomendar. Restaurações frequentes podem causar falha permanente do hardware.'
            onRun={async () => {
              await (await loadDish()).factoryReset();
              return "Restauração de fábrica enviada — a antena está apagando e reiniciando.";
            }}
          />
          {isMotorized && (
            <DangerAction
              title={status?.stowRequested ? "Desdobrar antena" : "Recolher antena"}
              caption={
                status?.stowRequested
                  ? "Desdobra e readquire satélites em alguns minutos"
                  : "Dobra a antena e interrompe a internet até desdobrar"
              }
              buttonLabel={status?.stowRequested ? "Desdobrar" : "Recolher"}
              confirmLabel={status?.stowRequested ? "Sim, desdobrar" : "Sim, recolher"}
              onRun={async () => {
                await (await loadDish()).stow(Boolean(status?.stowRequested));
                return status?.stowRequested
                  ? "Desdobramento enviado — abrindo."
                  : "Recolhimento enviado — dobrando.";
              }}
            />
          )}
        </>
      )}
    </>
  );
}
