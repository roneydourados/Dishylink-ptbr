# Changelog

Todas as mudanças notáveis do Painel Órbita são documentadas aqui.

## [1.2.0] - 2026-09-18

### Uso por dispositivo

- O Painel Órbita não cobra mais as próprias consultas no dispositivo em
  que roda. Ele mede o custo do próprio polling e desconta antes de gravar o
  número, para a máquina em que você usa mostrar o uso que você fez, e não o
  uso de ficar olhando. Consultas de satélite também deixaram de ser contadas,
  e as linhas armazenadas mantêm os valores brutos.
- A nota explicando que o número de um dispositivo ainda inclui as consultas do
  app agora só aparece onde você pode agir sobre isso.

### Regras de rede

- Um dispositivo com fio agora diz isso no seletor de regras. O roteador não
  mantém contadores de bytes para clientes com fio, então uma cota de dados não
  tem o que medir aí. Horas ainda podem ser limitadas com agenda ou timer.
- O seletor lista todos os dispositivos da rede, não só os que já têm registro
  de uso.
- Uma regra, ou o lugar de um dispositivo num grupo, não se perde mais enquanto
  o dispositivo está ausente. Ausência estava sendo lida como exclusão. Uma
  regra termina quando você apaga a regra ou o registro do dispositivo.
- Um dispositivo cujos registros foram mesclados abre de novo o próprio limite,
  em vez de um vazio.

### Latência

- Histórico de qualidade de latência, com histogramas por minuto e dashboard
  próprio. (#34)

### Desktop, navegador e hospedagem

- O ícone da barra de menus do macOS pode combinar com o resto da barra, ou
  ser ocultado para só o painel de throughput aparecer. (#38)
- Abrir o Painel Órbita enquanto ele já está rodando traz a janela
  aberta para frente, em vez de falhar. (#43)
- Nós mesh podem ser renomeados na aba Nós.
- O dashboard web e o gravador de histórico saem como imagens Docker. (#16)
- O Painel Órbita agora está na loja Edge Add-ons.

### Também adicionado

- O app pergunta uma vez se você avaliaria, e separadamente se ajudaria a
  financiar. “Talvez depois” volta em dois dias, “Não perguntar de novo”
  encerra, e agir em qualquer um dos pedidos encerra de vez.

### Corrigido

- O gravador de histórico não tropeça mais no próprio diretório de dados
  quando uma segunda cópia sobe no mesmo processo.

## [1.1.0] - 2026-08-22

### Regras de rede

- Coloque uma regra num único dispositivo, ou num grupo, em uma de três formas:
  um **limite** que pausa ao atingir uma quantidade de dados, uma **agenda**
  que pausa fora das horas definidas, ou um **timer** que pausa quando a
  contagem regressiva acaba.
- Um limite roda em base diária, semanal, mensal, personalizada, ciclo de
  faturamento Starlink ou única. Num grupo, a cota é compartilhada entre os
  dispositivos ou aplicada a cada um separadamente.
- Uma agenda guarda várias janelas, então “16h às 20h em dias úteis, 9h às
  21h no fim de semana” é uma regra, não duas. As janelas rodam em dias da
  semana escolhidos ou entre datas escolhidas, podem cruzar a meia-noite e
  mantêm as horas definidas através de mudança de horário de verão.
- Um timer conta a partir do momento em que você salva, e dura no máximo 24
  horas.
- Dispositivos são pausados automaticamente quando a regra se esgota, e
  liberados quando o próximo ciclo começa.
- O gasto de um dispositivo carrega corretamente quando o limite é editado no
  meio do ciclo, e sobrevive a reinício do app ou da antena sem contar duas
  vezes.
- Seis meses de histórico de uso por dispositivo agora são mantidos.
- Um dispositivo sob regra é marcado na lista de rede, com a regra e o status
  acessíveis no detalhe do dispositivo.
- Valores de bytes de um terabyte ou mais agora aparecem em TB.

### Conta Starlink e controle na nuvem

- Vincule uma conta Starlink para ler a lista de clientes, a config da antena
  e os nomes dos dispositivos pela nuvem quando a LAN não servir, com nova
  tentativa automática e failover entre edges se um parar de responder.
- Renomeie e pause dispositivos pela conta vinculada, inclusive pela extensão
  do navegador.
- O Painel Órbita se recusa a pausar o dispositivo em que está rodando,
  de qualquer rede.

### Modo bypass

- Alterne o roteador para dentro e fora do modo bypass pelo app.
- Um roteador em bypass é lido como em bypass, e não como ausente, para os
  painéis dizerem isso claramente e o silêncio na rede não gerar alerta.

### Configuração do roteador

- Altere a sub-rede e os servidores DNS do roteador.
- Alcance e gerencie um roteador que não está no endereço padrão 192.168.1.1.
- Reset de fábrica do roteador. Um roteador em bypass não responde nada na
  rede local, então o reset vai pela conta vinculada.

### Também adicionado

- Reset de fábrica da antena, atrás da mesma confirmação armada do roteador.
- O estado de atualização de software pendente da antena e do roteador agora
  aparece no dashboard.
- Seletor de horário para a agenda de sono.
- Painel ao vivo de throughput na barra de menus do macOS, exibido por padrão.
- Ícones de severidade (info/aviso/erro) agora compartilham um componente e
  escala de cor em todo o app.
- Escolha o que o badge da barra de ferramentas da extensão conta: todos os
  alertas, só falhas que um dispositivo reportou sobre si mesmo, ou nada.
  Estar longe do Starlink é indistinguível de um dispositivo que falhou, então
  a opção do meio deixa os dois de fora.

### Corrigido

- O app desktop não mostra mais “A JavaScript error occurred in the main
  process” quando a rede cai por baixo dele: acordar do sono, VPN conectando,
  ou o roteador entrando em bypass. Falhas que não são perda de conexão ainda
  aparecem exatamente como antes.
- Uma mudança no roteador que deu timeout não alega mais que a Starlink
  rejeitou. Nada respondeu, o que não é o mesmo que uma recusa.
- Um kit sem roteador Starlink não reporta mais “Roteador não está
  respondendo”. Não há o que alcançar, então o silêncio não é anunciado, não
  conta no sino e não é gravado como outage. A checagem ainda aparece na
  lista de Status, já que não foi executada.
- Requisições cross-origin para as rotas da nuvem são rejeitadas.
- O historian só é servido para a máquina em que roda.
- Layout do dashboard: mais folga abaixo da última linha, janela padrão mais
  larga, contraste mais estável dos botões secundários nos dois temas, e um
  botão de renomear que mantém a largura enquanto o save está em andamento.
