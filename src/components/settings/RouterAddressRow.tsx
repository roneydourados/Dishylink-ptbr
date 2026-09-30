// Where the app dials the router.
//
// This row has to keep working when the router does not answer, because a wrong
// address is the most likely reason it doesn't. Nothing here may sit behind a
// reachability check.

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingRow } from "./settingsChrome";
import { normalizeIpAddress } from "@core/ipAddress";
import {
  routerAddressHost,
  type RouterAddressWriteResult,
  type RouterAddress,
} from "../../lib/routerAddressHost";
import { addressSavable, saveArgument } from "./routerAddressDraft";

const REFUSAL_MESSAGE: Record<Extract<RouterAddressWriteResult, { ok: false }>["reason"], string> =
  {
    invalid: "Isso não é um endereço IP que este app possa alcançar. Use o endereço numérico, não um nome.",
    denied: "A permissão para alcançar esse endereço foi recusada, então ele não foi salvo.",
    unsupported: "Este navegador não pode receber acesso a esse endereço. Use um endereço IPv4.",
  };

export function RouterAddressRow({
  addresses,
  onChanged,
}: {
  addresses: RouterAddress;
  onChanged: (next: RouterAddress) => void;
}) {
  const stored = addresses.router;
  const fallback = addresses.routerDefault;
  const [draft, setDraft] = useState(stored ?? "");
  const [saving, setSaving] = useState(false);
  const [refused, setRefused] = useState<
    Extract<RouterAddressWriteResult, { ok: false }>["reason"] | null
  >(null);

  // The field follows what the host confirmed it stored, so a save that was
  // normalised on the way in shows the value actually in use.
  const [shownStored, setShownStored] = useState(stored);
  if (shownStored !== stored) {
    setShownStored(stored);
    setDraft(stored ?? "");
    setRefused(null);
  }

  const trimmed = draft.trim();

  const save = () => {
    const host = routerAddressHost();
    if (!host || !addressSavable(draft, stored)) return;
    setSaving(true);
    setRefused(null);
    void host
      .write(saveArgument(draft))
      .then((result) => {
        if (result.ok) onChanged(result.addresses);
        else setRefused(result.reason);
      })
      .finally(() => setSaving(false));
  };

  return (
    <>
      <SettingRow
        title='Endereço IP do roteador'
        info={`O Starlink Monitor Br procura seu roteador neste endereço. Altere só se a sub-rede do roteador foi mudada no app Starlink, ou se seu kit está em modo bypass atrás de um roteador de terceiros. Limpar o campo volta para ${fallback}.`}
        infoSeverity='warn'
        caption={`O padrão é ${fallback}`}
        note={
          refused ? (
            <span className='text-destructive'>{REFUSAL_MESSAGE[refused]}</span>
          ) : stored ? (
            `O Starlink Monitor Br está usando ${stored}. Limpe o campo para voltar a ${fallback}.`
          ) : undefined
        }
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
          }}
          placeholder={fallback}
          spellCheck={false}
          autoComplete='off'
          inputMode='numeric'
          aria-label='Endereço IP do roteador'
          aria-invalid={trimmed !== "" && normalizeIpAddress(trimmed) === null}
          className='h-8 w-[168px] font-mono text-[12px] tabular-nums'
        />
        <Button
          size='sm'
          variant='secondary'
          disabled={!addressSavable(draft, stored) || saving}
          onClick={save}
        >
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </SettingRow>
    </>
  );
}
