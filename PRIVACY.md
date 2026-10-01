# Política de Privacidade

O Painel Órbita é um aplicativo de código aberto que monitora o
desempenho e a saúde do seu kit de internet satélite. Esta página descreve o
que o app faz com os seus dados.

## O que permanece na sua máquina

O Painel Órbita se comunica diretamente com a antena e o roteador pela
sua própria rede local (LAN), inclusive com a janela fechada. Tudo o que ele
mede — taxa de transferência, latência, consumo de energia, obstrução,
interrupções, eventos térmicos, temperatura dos rádios, lista de dispositivos —
é gravado no armazenamento local da sua máquina e nunca é transmitido para
lugar nenhum. Não há backend, analytics nem coleta de telemetria da nossa
parte. Nós não vemos os seus dados; nunca os recebemos.

## O recurso opcional “conectar conta”

Se você optar por entrar com a sua própria conta Starlink (aba “Conta na
nuvem”), o app abre uma janela de login da Starlink e mantém a sessão
resultante apenas no seu dispositivo:

- No desktop, a sessão fica no diretório de dados local do app, criptografada
  com o chaveiro do sistema operacional quando disponível.
- Na extensão do navegador, a sessão fica na área de armazenamento da própria
  extensão, dentro do perfil do navegador. Nenhum site e nenhuma outra
  extensão consegue lê-la. Ela não fica criptografada em repouso, então
  qualquer coisa com acesso ao perfil do navegador no disco poderia lê-la.
- A sessão é usada somente para ler o seu próprio plano, faturamento e dados
  de uso diretamente de `starlink.com` em seu nome, em resposta às suas
  próprias solicitações.
- Ela nunca é enviada para nós nem para terceiros — não temos servidor que
  pudesse recebê-la. Ao desconectar a conta, a sessão armazenada é apagada.
  Na extensão, desconectar limpa apenas a cópia do Painel Órbita — o
  login do starlink.com no navegador permanece conectado.

Este recurso é totalmente opcional (opt-in). Se você nunca entrar, nenhuma
sessão de conta Starlink é criada ou armazenada.

## Terceiros

A única exceção a “nunca sai da sua máquina”: o teste de velocidade no app
mede a sua conexão contra a infraestrutura pública de teste de velocidade da
Cloudflare, da mesma forma que qualquer teste de velocidade baseado em
navegador. Essa requisição não carrega dados pessoais além do que qualquer
conexão de internet com a Cloudflare já envolve.

## Código aberto

O código-fonte do Painel Órbita é público, então você mesmo pode
verificar tudo acima — veja o repositório em que este arquivo está.

## Alterações

Se um recurso futuro mudar o que sai da sua máquina, este documento será
atualizado antes desse recurso ser lançado, e qualquer recurso assim exigirá
o seu próprio consentimento explícito (opt-in).

## Contato

Dúvidas sobre esta política: roneydourados@gmail.com
