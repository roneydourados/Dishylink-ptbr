// "Connect your Starlink account". A host that can run a real sign-in does — the
// desktop app opens Starlink's own login window and captures the session. A plain
// browser page has no such route: it can't lift the HttpOnly, cross-origin cookies
// with a button, so it falls back to pasting the Cookie header from DevTools — the
// Network-tab header, not document.cookie, which omits the HttpOnly
// Starlink.Com.Sso the token refresh needs.

import { useState } from "react";
import { cloudSignIn } from "../../lib/cloudHost";
import { connectCloud } from "../../lib/starlinkCloud";
import { Button } from "../ui/button";
import { SpinLoader } from "../loaders/SpinLoader";

const cardClass =
  "mt-2.5 flex flex-col gap-3 rounded-xl border border-border/70 " +
  "bg-[color-mix(in_srgb,var(--ink)_4%,var(--surface))] p-4";

export function ConnectAccount({ onConnected }: { onConnected: () => void }) {
  // Ask the host what it can do, not which host it is: the desktop app signs in
  // through its main process, the extension will through its background worker,
  // and the browser answers undefined because it genuinely cannot.
  const signIn = cloudSignIn();
  return signIn ? (
    <SignInConnect signIn={signIn} onConnected={onConnected} />
  ) : (
    <PasteConnect onConnected={onConnected} />
  );
}

function SignInConnect({
  signIn,
  onConnected,
}: {
  signIn: () => Promise<{ ok: boolean; message?: string }>;
  onConnected: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    signIn()
      .then((result) => {
        if (result.ok) onConnected();
        else setError(result.message ?? "O login não foi concluído.");
      })
      .catch(() => setError("Falha no login."))
      .finally(() => setBusy(false));
  };

  return (
    <div className='flex w-full max-w-[420px] flex-col items-center gap-5 text-center'>
      <div className='flex flex-col gap-2'>
        <h2 className='m-0 text-[19px] font-semibold tracking-tight'>
          Conecte sua conta Starlink
        </h2>
        <p className='m-0 text-[13.5px] leading-relaxed text-ink-secondary'>
          Veja seu plano, uso de dados, endereço de serviço e todas as antenas e roteadores da
          conta, e ative controles suportados do roteador, como pausar dispositivos conectados. Sua
          sessão fica criptografada neste dispositivo e só é enviada à Starlink.
        </p>
      </div>

      {error && <div className='text-[12.5px] text-status-critical'>{error}</div>}

      <Button onClick={start} disabled={busy} className='w-full max-w-[260px] border-0'>
        {busy ? (
          <SpinLoader size={20} variant='activity' label='Entrando' />
        ) : (
          "Entrar com Starlink"
        )}
      </Button>

      <p className='m-0 text-[11.5px] text-muted-foreground'>
        Abre uma janela de login da Starlink — nada é compartilhado com ninguém além da Starlink.
      </p>
    </div>
  );
}

const STEPS = [
  <>
    Em uma nova aba, entre em{" "}
    <a
      href='https://www.starlink.com/account'
      target='_blank'
      rel='noreferrer'
      className='underline underline-offset-2'
    >
      starlink.com/account
    </a>
    .
  </>,
  <>
    Abra o DevTools (<kbd className='mono-value'>F12</kbd> / <kbd className='mono-value'>⌥⌘I</kbd>)
    e vá à aba <strong>Rede</strong> (Network).
  </>,
  <>Recarregue a página e clique em qualquer requisição para starlink.com na lista.</>,
  <>
    Em <strong>Cabeçalhos da solicitação</strong> (Request Headers), encontre <code>cookie:</code> e
    copie o valor <strong>inteiro</strong>.
  </>,
  <>
    Cole abaixo e conecte. (Não use o document.cookie do console — ele omite a parte que
    precisamos.)
  </>,
];

function PasteConnect({ onConnected }: { onConnected: () => void }) {
  const [cookie, setCookie] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!cookie.trim() || busy) return;
    setBusy(true);
    setError(null);
    connectCloud(cookie.trim())
      .then(onConnected)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Não foi possível conectar."))
      .finally(() => setBusy(false));
  };

  return (
    <div className={cardClass}>
      <div>
        <div className='text-[14px] font-semibold'>Conecte sua conta Starlink</div>
        <div className='mt-0.5 text-[12.5px] leading-normal text-ink-secondary'>
          Adiciona detalhes da conta e controles suportados do roteador. A sessão é gravada em um
          arquivo local <code>.starlink-cookie</code> nesta máquina e só é enviada à Starlink.
        </div>
      </div>

      <ol className='m-0 flex list-none flex-col gap-1.5 p-0'>
        {STEPS.map((step, index) => (
          <li key={index} className='flex gap-2.5 text-[12.5px] leading-snug text-ink-secondary'>
            <span className='mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--ink)_10%,var(--surface))] text-[11px] font-semibold text-foreground'>
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <textarea
        value={cookie}
        onChange={(e) => setCookie(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
        placeholder='Starlink.Com.Sso=…; Starlink.Com.Access.V1=…; …'
        aria-label='Cookie de sessão Starlink'
        spellCheck={false}
        rows={3}
        className='min-w-0 resize-y rounded-md border border-input bg-card px-2.5 py-2 font-mono text-[11.5px] leading-normal break-all text-foreground focus:border-ink focus:outline-none'
      />

      {error && <div className='text-[12px] text-status-critical'>{error}</div>}

      <div className='flex items-center gap-2'>
        <Button
          onClick={submit}
          disabled={!cookie.trim() || busy}
          size='sm'
          className={`w-fit border-0 ${
            busy
              ? "bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] text-muted-foreground disabled:opacity-100"
              : ""
          }`}
        >
          {busy ? <SpinLoader size={20} variant='activity' label='Conectando' /> : "Conectar"}
        </Button>
        <span className='text-[11.5px] text-muted-foreground'>⌘↵ para enviar</span>
      </div>
    </div>
  );
}
