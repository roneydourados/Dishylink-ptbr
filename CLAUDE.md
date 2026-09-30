# CLAUDE.md

Este arquivo orienta o Claude Code (claude.ai/code) ao trabalhar com código
neste repositório.

## Visão geral do projeto

Dashboard ao vivo mais um gravador sempre ligado (o “historian”) para um kit
Starlink. A máquina de desenvolvimento está na própria rede Starlink —
mudanças são verificadas contra hardware real.

## Segurança de hardware — leia antes de tocar em qualquer coisa do roteador

- **NUNCA chame ou faça poll do `get_ping` do roteador (campo 1009), em
  nenhum intervalo.** Testado três vezes em 2026-07-20 (2s, 5s e 30s); cada
  teste foi seguido, em cerca de 15 minutos, por um reboot do watchdog do
  roteador que derrubou a rede. O sucesso de ping do roteador vem do
  `popPingDropRate5m` do `get_status` (com `m` minúsculo no final), que vem
  numa resposta que já buscamos.
- `wifi_get_ping_metrics` (3007) e `set_config` respondem PERMISSION_DENIED
  a clientes anônimos na LAN no firmware atual. O app oficial obtém dados da
  nuvem por uma sessão autenticada em `api.starlink.com`, não pela LAN.
- O roteador é uma caixinha embarcada e já reiniciou sob carga comum:
  **nunca adicione um novo poll contra ele sem aprovação explícita.**
  Reutilize respostas que já estão sendo buscadas — `routerStatusFeed` no
  navegador, o poll de status de 5s no gravador.

## CI

O CI roda `npm run typecheck`, `npm run lint`, `npm test` e uma checagem do
prettier. O job de format só checa arquivos alterados, então um
`prettier --check` na árvore inteira reporta um backlog pré-existente que não
é seu. Testes que abrem socket se comportam diferente no runner Linux e no
macOS, então um verde local não garante verde no CI.

## Fatos de processo

- O historian (`collector/historian.mts`) é o serviço de gravação sempre
  ligado, rodado pelo launchd como `com.dishylink.historian`. Edições em
  `collector/` precisam de
  `launchctl kickstart -k gui/$UID/com.dishylink.historian` para valer;
  `tsc` e `vitest` passam sem isso. As gravações ficam em `collector/data`.
- “Historian” é o nome do componente no código, no serviço e na documentação.
  O texto voltado ao usuário fica em português simples — “gravador de
  histórico” ou “gravação” — porque quem lê a UI não precisa conhecer o termo
  industrial.
- A sessão colada do starlink.com fica em `.starlink-cookie` na raiz do repo
  (escrita por `dev/starlinkCloudProxy.ts`). É uma credencial viva: nunca
  imprima, nunca faça commit.
