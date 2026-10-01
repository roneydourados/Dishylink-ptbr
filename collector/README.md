# Gravador de energia (historian)

Um serviço Node sempre ligado, pequeno, que registra o consumo de energia da
antena ao longo do tempo para o dashboard poder mostrar totais de **dia /
semana / mês** — dados que nem a antena (buffer circular de ≈15 min) nem a
aba do navegador (≤6 h, apagado no reload) guardam.

## O que faz

- Faz poll do buffer de histórico da antena a cada 5 s, reutilizando o
  transporte grpc-web do frontend (`src/lib/grpcWeb.ts`) e o decoder
  (`src/lib/telemetry.ts`) para os dois não divergirem.
- Agrega novas leituras de potência por segundo em buckets de energia por
  minuto e anexa cada minuto concluído em `collector/data/energy.ndjson`
  (uma linha JSON por minuto: `{ minute, wattSeconds, samples }`).
- Serve totais via HTTP em `:8088` — o servidor de desenvolvimento faz proxy
  de `/api` para ele.

## Honestidade sobre lacunas

A energia é integrada **somente nos minutos realmente amostrados**. Se o
historian estiver parado (sono, reinício, queda de Wi‑Fi), esses minutos
simplesmente não têm dados — o total nunca inventa “últimos watts conhecidos”
através de uma lacuna. Toda resposta inclui uma fração de `coverage`, e a UI
mostra, por exemplo, _“coletado 82% deste período”_.

Lacunas curtas (≤15 min) são preenchidas sem perda no próximo poll a partir
do próprio buffer circular da antena; lacunas maiores aparecem como cobertura
reduzida.

## Como rodar

Em primeiro plano (morre ao fechar o terminal / dormir):

```
npm run historian
```

Sempre ligado (sobrevive ao logout, relança após sono/crash) via launchd:

```
cp collector/com.painelorbita.historian.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.painelorbita.historian.plist
```

Parar / desinstalar:

```
launchctl unload ~/Library/LaunchAgents/com.painelorbita.historian.plist
```

Os caminhos do plist são absolutos para esta máquina — atualize-os se o repo
mudar de lugar ou a versão do Node mudar.

## API

- `GET /api/energy?range=day|week|month` →
  `{ range, totalKWh, coverage: { sampledSeconds, expectedSeconds, fraction }, buckets: [{ t, kWh, sampledSeconds }] }`
  Os intervalos são alinhados à **meia-noite local** (fuso do sistema). `day`
  devolve buckets horários; `week`/`month` devolvem buckets diários.
- `GET /api/health` → `{ ok, lastWrittenMinute }`
