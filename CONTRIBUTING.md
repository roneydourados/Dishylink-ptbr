# Contribuindo com o Painel Órbita

Obrigado pelo interesse. O Painel Órbita conversa com hardware Starlink
de verdade, então algumas regras abaixo são para não derrubar a internet de
alguém — e não só sobre estilo de código. Leia a seção de hardware antes de
tocar em qualquer coisa que faça poll na antena ou no roteador.

## Antes de começar

A maior parte do app pode ser trabalhada de qualquer lugar, mas tudo que lê
telemetria ao vivo exige que você esteja **na própria rede Starlink**. A
antena responde em `192.168.100.1` e o roteador em `192.168.1.1`; nenhum dos
dois é alcançável de fora da LAN, e não existe fixture pública de teste que se
comporte como o hardware real sob carga.

Se você não consegue entrar numa rede Starlink, boas áreas para ajudar são os
gráficos, as visualizações de histórico gravado, testes e documentação — tudo
isso roda com dados gravados ou sintéticos.

## Segurança de hardware

O roteador é um dispositivo embarcado pequeno e já reiniciou sob carga comum
de polling. Duas regras seguem disso:

- **Nunca chame o `get_ping` do roteador (campo 1009), em nenhum intervalo.**
  Foi testado em 2s, 5s e 30s; cada teste foi seguido, em cerca de 15 minutos,
  por um reboot do watchdog do roteador que derrubou a rede. O sucesso de ping
  do roteador já vem do `popPingDropRate5m` do `get_status`, que vem numa
  resposta que o app já busca.
- **Não adicione um novo poll contra a antena ou o roteador.** Reutilize uma
  resposta que já está sendo buscada — `routerStatusFeed` no navegador, ou o
  poll de status existente no gravador. Se você realmente precisar de um novo,
  abra uma issue antes para discutir, antes que o link de alguém caia.

DNS customizado, bypass mode e filtro de conteúdo deliberadamente não são
expostos: uma escrita ruim aí pode derrubar o Wi‑Fi até um reset físico.

## Como rodar

```bash
npm install

npm run dev             # harness web — exige estar na LAN Starlink
npm run dev:electron    # app desktop (macOS, Windows)
npm run dev:extension   # extensão do navegador (Chrome, Edge, Firefox)
```

Os três produtos são independentes: não compartilham runtime, e cada um faz
poll e grava por conta própria. Uma mudança no código compartilhado em `src/`
afeta os três, então verifique o que você não pretendia tocar.

## Checagens

O CI roda em todo push e pull request, e precisa estar verde antes do merge:

```bash
npm run typecheck            # tsc -b
npm run lint                 # eslint; warnings falham o build
npm test                     # vitest
npm run format               # prettier; corrige a árvore no lugar
npm run typecheck:extension  # tipos específicos da extensão
```

A formatação só é exigida nos arquivos que a mudança toca, então você não
será pedido para reformatar código que não escreveu.

Os testes rodam em Node, exceto alguns arquivos da extensão que precisam de
IndexedDB de verdade; esses rodam em Chromium headless via Playwright. Rode
`npx playwright install chromium` uma vez se ainda não tiver.

## Pull requests

- Crie o branch a partir de `master`, um assunto por PR.
- **Rotule o PR** com `enhancement`, `bug` ou `documentation`. As notas de
  release são geradas a partir desses rótulos; um PR sem rótulo cai em
  “Other Changes”.
- Descreva o que mudou e, para qualquer coisa que toque a antena ou o
  roteador, como você verificou no hardware real.

## Releases

Para mantenedores:

```bash
npm version minor        # sobe package.json, faz commit e tag
git push --follow-tags
```

Enviar uma tag `v*` gera builds macOS, Windows e os arquivos da extensão, e
cria um release em **rascunho**. Nada chega aos usuários até o rascunho ser
publicado no GitHub — apps instalados ignoram drafts, então esse clique é o
rollout de fato.

A tag precisa bater com a versão do `package.json`; o CI falha rápido se não
bater — por isso `npm version` é o jeito certo de subir a versão, em vez de
editar na mão.

## Reportar problemas

Abra uma issue com as versões de firmware da antena e do roteador, a
plataforma em que está e a saída de **Copiar dados de depuração** do painel
de configurações quando for relevante — ela junta diagnósticos, status e
config em JSON.

Se acredita ter encontrado um problema de segurança, reporte de forma privada
pela aba de segurança do repositório, em vez de abrir uma issue pública.

## Obrigado

Seja com um recurso novo, uma correção de bug, documentação melhor ou só um
typo neste arquivo — a ajuda é apreciada. O Painel Órbita fica melhor
com mais olhos nele, e cada melhoria chega a alguém encarando um link ruim às
2h da manhã.

Boas contribuições.
