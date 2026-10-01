# API local da Starlink — comportamento medido

Não há documentação oficial da API gRPC local da antena ou do roteador.
`public/dish.protoset` é extraído do serviço de **reflection** gRPC do próprio
dispositivo, o que dá nomes de campos e tipos no fio — e nada mais: sem
unidades, sem taxas de atualização e **sem indicação de quais campos o
firmware realmente preenche**.

Esse último ponto é o caro. A reflection descreve a _interface_; não diz nada
sobre a _implementação_. Um campo pode existir, ter o tipo certo e estar
permanentemente vazio.

Tudo abaixo foi medido em hardware ao vivo, não lido de uma especificação.

Hardware na época da medição: `rev4_panda_prod2`, firmware `2026.07.06.mr81950`.
Remeça após uma atualização de firmware antes de confiar em qualquer disso.

## Relógios de amostragem — o piso da resolução

| Fonte                          | Taxa                                                   | Profundidade         |
| ------------------------------ | ------------------------------------------------------ | -------------------- |
| Buffer circular `dish_get_history` | **1,00 s/amostra** (contador avançou 10 em 10,1s)  | 900 amostras = 15 min |
| `dish_get_status`              | subsegundo (49 leituras distintas em 50 polls a 200ms) | só instantâneo       |
| `wifi_get_clients`             | só instantâneo — **sem buffer**                        | —                    |

**Fazer poll mais rápido que o relógio de amostragem não ganha nada.** Para a
antena isso importa menos do que parece: cada chamada a `dish_get_history`
devolve o anel inteiro de 900 amostras, então um poll de 5s ainda captura
cada amostra de 1 Hz. A taxa de poll controla a _atualidade_ (quão velho é o
ponto mais novo), não a _resolução_.

No roteador vale o contrário. Não há buffer funcional, então a taxa de poll
**é** a resolução — o que não for amostrado se perde de vez.

## Custo dos polls

| RPC                       | Payload             | RTT mediano | Custo a 1 Hz |
| ------------------------- | ------------------- | ----------- | ------------ |
| `dish_get_history` (1007) | 18.128 B            | 66 ms       | 17,7 kB/s    |
| `dish_get_status` (1004)  | 523 B               | 86 ms       | 0,5 kB/s     |
| `wifi_get_clients` (3002) | 1.611 B (5 clientes)| 7 ms        | 1,6 kB/s     |

`wifi_get_clients` a 1 Hz ocupa o roteador ~0,7% de cada segundo, 0 falhas em
30 chamadas consecutivas. Uma chamada cobre todos os clientes — não há
fan-out por dispositivo.

## Campos que existem mas nunca são preenchidos

Presentes no schema, sempre vazios neste firmware. Não construa em cima
deles sem reprovar primeiro.

### `wifi_get_client_history` (3015) — completamente vazio

O beco sem saída mais convincente da API. Devolve um buffer circular com o
mesmo formato da antena — `current` avançando a um genuíno 1 Hz, arrays de
900 floats — e **cada amostra é zero, em todo cliente, sempre**.

Verificado sob 65 Mbps de carga sustentada, com um cliente que o próprio
roteador reportava a 106,58 Mbps ao vivo:

```
Controller   live=   0.00 Mbps  maxRx=0.0000 maxTx=0.0000  nonZeroOfAll=0/1800
(unnamed)    live= 106.58 Mbps  maxRx=0.0000 maxTx=0.0000  nonZeroOfAll=0/1800
iPhone       live=   1.78 Mbps  maxRx=0.0000 maxTx=0.0000  nonZeroOfAll=0/1800
```

Seus campos `rssi`, `throughput_limited` e `rx_rate_mbps` estão ausentes por
completo.

O contador ticando a 1 Hz faz isso parecer vivo numa sonda rasa. Não é.
Reverifique com `scripts/probe-client-history.mts`.

### Outros

| RPC                    | Campo                | Realidade                                            |
| ---------------------- | -------------------- | ---------------------------------------------------- |
| `dish_get_status`      | `popPingDropRate`    | ausente — só no histórico                            |
| `dish_get_status`      | `powerIn`            | ausente — só no histórico                            |
| `get_radio_stats`      | `thermalStatus.temp` | ausente; só `temp2` é preenchido                     |
| `TransceiverGetStatus` | todos                | `Unimplemented` — não existem temperaturas numéricas da antena |

As lacunas de `dish_get_status` importam mais do que parecem: montar amostras
de gráfico só a partir do status zera silenciosamente `dropRate` e `powerW`,
o que achata o gráfico de potência **e desliga a detecção de outage**, já que
ela só dispara quando toda amostra recente mostra perda total de pacotes.

## De onde os dados realmente vêm

| Série                             | Fonte                                    | Por quê                                |
| --------------------------------- | ---------------------------------------- | -------------------------------------- |
| Throughput / latência / potência da antena | `dish_get_history` @ 1s         | anel completo a 1 Hz; poll = atualidade |
| Tiles de estatísticas ao vivo     | `dish_get_status` @ 1s                   | subsegundo, payload minúsculo          |
| Throughput por dispositivo        | `wifi_get_clients` @ 1s → `ClientWindow` | única fonte; sem buffer de fallback    |
| Visão 6h por dispositivo          | mesma → `ClientStore` (por minuto)       | nível agregado                         |
| Log de eventos do roteador        | `wifi_get_history` (1007 no roteador)    | mesmo formato `UXEvent` da antena      |
| Temps dos rádios Wi‑Fi            | `get_radio_stats` (1036, só roteador)    | antena responde `Unimplemented`        |

## Escritas pela LAN estão bloqueadas

O firmware de julho/2026 rejeita **todas** as RPCs de escrita pela LAN —
renomear, `set_config` — com status gRPC 7. O app oficial faz escritas pela
nuvem da Starlink, não pela LAN. Não existe caminho local de elevação.

## Escritas autenticadas na nuvem do roteador

Duas coisas aprendidas da forma difícil, ambas medidas em 2026-08-15:

1. **Chaveie escritas de cliente em `clientId`, nunca em `macAddress`.** Este
   firmware mascara os três octetos baixos de todo MAC que reporta
   (`60:74:f4:XX:XX:XX`), então dispositivos do mesmo fabricante compartilham
   um endereço. Um rename chaveado por MAC renomeou quatro dispositivos.
2. **A antena também aceita escritas neste caminho** — `dishSetConfig` com o
   `targetId` `ut…` da antena, não só `wifiSetConfig` com `Router-…`.
   Confirmado ao definir `swupdateRebootHour` e ler de volta no app oficial.

Pause e unpause foram medidos pelo endpoint grpc-web autenticado da Starlink
`SpaceX.API.Device.Device/Handle`. Esta é uma interface não oficial, observada,
e não uma API publicada — pode mudar com firmware ou atualizações de serviço
da Starlink. O comportamento foi verificado na mesma instalação descrita no
topo deste documento; registre o hardware e o firmware do roteador a partir de
**Copiar dados de depuração** ao reportar ou retestar.

A requisição aceita usa `wifiSetConfig.wifiConfig.clientConfigs` com
`applyClientConfigs: true`. Um cliente permanentemente pausado tem uma entrada
em `weeklyBlockSchedules` cujo `groupId` é `_permanent` e cuja única faixa
cobre a semana inteira (`0` a `10080` minutos). Despausar remove só essa
entrada, para agendas não relacionadas permanecerem intactas.

Isto é uma atualização da lista inteira, não um patch de um único cliente. O
Painel Órbita, portanto, lê a configuração atual do roteador pela LAN
imediatamente antes de cada escrita, preserva todos os clientes e agendas não
relacionadas, muda só o cliente selecionado e serializa mutações para que
escritas concorrentes não se sobrescrevam. A requisição codificada é montada
pelo host confiável; protobuf fornecido pelo renderer nunca é aceito.

A escrita exige uma sessão de conta Starlink atual e só está disponível para
um dispositivo presente na lista ao vivo de clientes do roteador. O Starlink
Monitor Br não expõe o controle para o dispositivo em que está rodando,
evitando uma desconexão autoinfligida. A extensão do navegador desativa o
controle por completo porque não consegue identificar de forma confiável o
próprio cliente na LAN; o desktop e o host de desenvolvimento web conseguem
estabelecer essa identidade antes de oferecer a escrita. O Electron lê as
interfaces de rede do host, enquanto o servidor de desenvolvimento web responde
`/api/whoami` a partir do endereço local do host ou do chamador. A extensão não
tem nenhum dos dois caminhos: suas requisições `/api/*` são mensagens a um
roteador interno de service worker/IndexedDB, e extensões desktop comuns do
Chrome não expõem IP ou MAC da LAN do host de forma confiável. A mutação na
nuvem em si funciona, mas habilitá-la sem auto-identidade poderia permitir que
o usuário pause o computador rodando o Painel Órbita — por isso a
capacidade da UI da extensão e a rota de mutação em background ficam
desabilitadas.
Use `scripts/probe-client-pause-state.mts` para um snapshot somente leitura das
agendas de bloqueio persistidas e do estado efetivo dos clientes conectados.

## Sondagem

`scripts/probe-rpcs.mts` — quais RPCs opcionais este firmware implementa.
`scripts/probe-client-history.mts` — profundidade do buffer e intervalo de
amostra da RPC de histórico por cliente.
`scripts/probe-client-pause-state.mts` — agendas de pause persistidas
(somente leitura) e estado efetivo dos clientes conectados.

Duas lições que valem guardar, ambas aprendidas da forma difícil:

1. **Um campo existir não diz nada sobre ele estar preenchido.** Cheque `max()`
   no array inteiro, não só nos valores mais novos.
2. **Sonde sob carga.** Zeros numa rede ociosa são indistinguíveis de zeros
   que são sempre zero.
