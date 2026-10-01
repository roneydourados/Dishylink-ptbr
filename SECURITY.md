# Política de Segurança

## Como reportar uma vulnerabilidade

Reporte problemas de segurança de forma privada, em vez de abrir uma issue
pública. Use o botão **Report a vulnerability** na
[aba Security](https://github.com/roneydourados/starlink-monitor-br/security/advisories/new)
deste repositório, que abre uma conversa privada visível só para você e o
mantenedor. Se preferir e-mail, **roneydourados@gmail.com** chega ao mesmo
lugar.

Inclua o que encontrou, como reproduzir, em qual plataforma estava e a versão
do Painel Órbita que estava usando.

Os relatos são lidos e respondidos sob o melhor esforço de um único
mantenedor. Aguarde um prazo razoável para a correção antes de divulgar
detalhes publicamente.

## Versões suportadas

As correções entram na última versão publicada. Versões antigas não recebem
patch — atualizar é o caminho para receber a correção.

## Escopo

No escopo:

- O app desktop (builds macOS e Windows)
- A extensão do navegador
- O gravador de histórico que roda em segundo plano
- Como o app trata a sessão da conta Starlink, e tudo o que ele grava no
  armazenamento local ou em disco

Fora do escopo:

- Vulnerabilidades no hardware Starlink, no firmware da antena ou do roteador,
  ou no próprio `starlink.com`. Isso é da SpaceX e deve seguir os canais de
  reporte da SpaceX.
- Qualquer coisa que exija que o atacante já tenha acesso total à sua máquina
  ou ao perfil do navegador. O [PRIVACY.md](PRIVACY.md) documenta o que é
  armazenado localmente e como.

## Testes

Teste em hardware que você possui. O Painel Órbita fala com a antena e
o roteador na sua própria rede, e o roteador é um dispositivo embarcado
pequeno que já foi observado reiniciando sob carga comum de polling. Não faça
fuzz nem estresse nos endpoints dele. Um roteador travado derruba a conexão
inteira, e isso por si só não é um achado.
