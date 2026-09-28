// Every alert the dish and router can raise, defined once.
//
// Both devices send alerts as bare booleans, and proto3 JSON drops false — so an
// absent key means "fine", never "unknown". Each entry therefore carries both
// faces: what to say when the flag is clear, and what to say when it is set.
// The clear-state wording follows the Starlink app's own Status list ("Motors
// healthy", "Mast is near vertical", "Not heating") so the two read alike.
//
// This is the source of truth for the notification panel, the status list, and
// which alerts are worth a desktop notification. It lives in core/ because every
// host needs it: the wording and the `notify` flag decide what each of them puts
// in front of the user, and keeping them somewhere only the browser could read
// is what tied alerting to an open window.

export type AlertSeverity = "critical" | "warning" | "advisory";

export interface AlertSpec {
  key: string;
  /** Shown when the flag is false — phrased as the good news, like the app. */
  ok: string;
  /**
   * Shown when the flag is true. Plain language: what is wrong, in the user's
   * terms — the condition only. It is the alert's one message, used verbatim
   * live and in history, so the same event never reads two different ways.
   */
  firing: string;
  /**
   * What to do about it, if there is anything. Kept out of `firing` so the
   * message stays a statement of fact: an instruction is useful next to a live
   * alert and noise against one that cleared an hour ago. Surfaced on the ⓘ.
   */
  advice?: string;
  severity: AlertSeverity;
  /** Worth interrupting someone with a desktop notification. */
  notify?: boolean;
  /** Whether the clearing is worth announcing too. Defaults to yes: most alerts
   *  here clear because a fault ended, which is news. False for one that retires
   *  on a timer, where nothing has changed to report. */
  notifyClear?: boolean;
}

/** Alerts on the dish's get_status. Order is roughly by how much it matters. */
export const DISH_ALERTS: AlertSpec[] = [
  {
    key: "dishWaterDetected",
    ok: "Sem água dentro da antena",
    firing: "Água detectada dentro da antena",
    severity: "critical",
    notify: true,
  },
  {
    key: "routerWaterDetected",
    ok: "Sem água dentro do roteador",
    firing: "Água detectada dentro do roteador",
    severity: "critical",
    notify: true,
  },
  {
    key: "thermalShutdown",
    ok: "Sem superaquecimento",
    firing: "A antena desligou para esfriar",
    severity: "critical",
    notify: true,
  },
  {
    key: "noEthernetLink",
    ok: "Ethernet conectado",
    firing: "Sem link Ethernet com o roteador",
    severity: "critical",
    notify: true,
  },
  {
    key: "motorsStuck",
    ok: "Motores saudáveis",
    firing: "Motores travados — a antena não consegue se orientar",
    severity: "critical",
    notify: true,
  },
  {
    key: "thermalThrottle",
    ok: "Temperatura normal",
    firing: "A antena está quente e limitando a velocidade para esfriar",
    severity: "warning",
    notify: true,
  },
  {
    key: "powerSupplyThermalThrottle",
    ok: "Temperatura da fonte normal",
    firing: "A fonte está quente e limitando a energia",
    severity: "warning",
    notify: true,
  },
  {
    key: "slowEthernetSpeeds",
    ok: "Velocidade Ethernet normal até o roteador",
    firing: "Link Ethernet lento com o roteador",
    severity: "warning",
    notify: true,
  },
  {
    key: "slowEthernetSpeeds100",
    ok: "Ethernet em velocidade máxima",
    firing: "Ethernet limitado a 100 Mbps",
    advice: "Verifique o cabo entre a antena e o roteador.",
    severity: "warning",
  },
  {
    key: "upsuRouterPortSlow",
    ok: "Porta da fonte normal",
    firing: "A porta do roteador na fonte está lenta",
    severity: "warning",
  },
  {
    key: "mastNotNearVertical",
    ok: "Mastro quase vertical",
    firing: "Mastro não está quase vertical",
    severity: "warning",
  },
  {
    key: "lowMotorCurrent",
    ok: "Corrente dos motores normal",
    firing: "Corrente dos motores baixa",
    severity: "warning",
  },
  {
    key: "lowerSignalThanPredicted",
    ok: "Sinal conforme o previsto",
    firing: "Interferência climática",
    advice:
      "Chuva forte, neve ou nuvens densas estão enfraquecendo o sinal abaixo do que a antena previu — melhora quando o tempo limpa. Se o céu estiver limpo, verifique se algo novo obstrui a visão da antena.",
    severity: "warning",
  },
  {
    key: "dbfTelemStale",
    ok: "Telemetria atualizada",
    firing: "Telemetria da antena desatualizada",
    severity: "warning",
  },
  {
    key: "unexpectedLocation",
    ok: "No local de serviço",
    firing: "A antena está longe do local de serviço registrado",
    severity: "warning",
  },
  {
    key: "obstructionMapReset",
    ok: "Mapa de obstrução intacto",
    firing: "Mapa de obstrução foi reiniciado — remapeando o céu",
    severity: "advisory",
  },
  {
    key: "roaming",
    ok: "Sem roaming",
    firing: "Em roaming — longe do endereço registrado",
    severity: "advisory",
  },
  {
    key: "isHeating",
    ok: "Sem aquecimento",
    firing: "Aquecendo para derreter neve ou gelo",
    severity: "advisory",
  },
  {
    key: "isPowerSaveIdle",
    ok: "Não está em espera",
    firing: "Em espera para economizar energia",
    severity: "advisory",
  },
  {
    key: "installPending",
    ok: "Atualização de software da Starlink concluída",
    firing: "Atualização de software da Starlink pendente",
    severity: "advisory",
  },
];

/** Alerts on the router's get_status. */
export const ROUTER_ALERTS: AlertSpec[] = [
  {
    key: "poeFuseBlown",
    ok: "Fusível da fonte intacto",
    firing: "Fusível da fonte queimou",
    severity: "critical",
    notify: true,
  },
  {
    key: "poeVinOvervoltage",
    ok: "Entrada de energia normal",
    firing: "Tensão de entrada da fonte muito alta",
    severity: "critical",
    notify: true,
  },
  {
    key: "poeVinUndervoltage",
    ok: "Entrada de energia estável",
    firing: "Tensão de entrada da fonte muito baixa",
    severity: "critical",
    notify: true,
  },
  {
    key: "poeRouterOvercurrent",
    ok: "Corrente do roteador normal",
    firing: "O roteador está puxando corrente demais",
    severity: "critical",
    notify: true,
  },
  {
    key: "poeOnDishUnreachable",
    ok: "Antena alcançável pela fonte",
    firing: "Não é possível alcançar a antena pela fonte",
    severity: "critical",
    notify: true,
  },
  {
    key: "ethSwitchError",
    ok: "Switch Ethernet saudável",
    firing: "Erro no switch Ethernet",
    severity: "critical",
    notify: true,
  },
  {
    key: "wanEthPoorConnection",
    ok: "Boa conexão com a antena",
    firing: "Conexão Ethernet ruim com a antena",
    severity: "warning",
    notify: true,
  },
  {
    key: "highCablePingDropRate",
    ok: "Link do cabo limpo",
    firing: "O cabo está perdendo pings",
    advice: "Verifique o cabo Starlink e as conexões nas duas pontas.",
    severity: "warning",
    notify: true,
  },
  {
    key: "thermalThrottle",
    ok: "Temperatura do roteador normal",
    firing: "O roteador está quente e reduzindo o Wi‑Fi para esfriar",
    severity: "warning",
    notify: true,
  },
  {
    key: "meshUnreliableBackhaul",
    ok: "Link mesh confiável",
    firing: "Nós mesh com link instável ao roteador",
    severity: "warning",
  },
  {
    key: "meshTopologyChangingOften",
    ok: "Topologia mesh estável",
    firing: "Nós mesh ficam trocando como se conectam",
    severity: "warning",
  },
  {
    key: "lanEthSlowLink10",
    ok: "Portas LAN em velocidade máxima",
    firing: "Uma porta LAN está em 10 Mbps",
    severity: "warning",
  },
  {
    key: "lanEthSlowLink100",
    ok: "Portas LAN sem limite",
    firing: "Uma porta LAN está limitada a 100 Mbps",
    severity: "warning",
  },
  {
    key: "wiredMeshNotUsingWanIface",
    ok: "Mesh cabeado na porta certa",
    firing: "Nó mesh cabeado não está usando a porta WAN",
    severity: "warning",
  },
  {
    key: "poeOffCurrentNominal",
    ok: "Saída da fonte normal",
    firing: "A fonte está desligada mas ainda consome corrente",
    severity: "warning",
  },
  {
    key: "radiusMissingProcess",
    ok: "Controle de acesso em execução",
    firing: "Processo de controle de acesso ausente",
    severity: "warning",
  },
  {
    key: "installPending",
    ok: "Atualização de software do roteador concluída",
    firing: "Atualização de software do roteador pendente",
    severity: "advisory",
  },
  {
    key: "freshlyFused",
    ok: "Roteador configurado",
    firing: "Roteador recém-ativado e ainda sem configuração",
    severity: "advisory",
  },
  {
    key: "sandboxDisabled",
    ok: "Sandbox disponível",
    firing: "Modo sandbox desativado",
    severity: "advisory",
  },
  {
    key: "onlyOverflightBlocked",
    ok: "Serviço sem restrições",
    firing: "Somente o serviço em sobrevoo está bloqueado",
    severity: "advisory",
  },
  {
    key: "offlineNetworksDisabled",
    ok: "Redes offline disponíveis",
    firing: "Redes offline desativadas",
    severity: "advisory",
  },
];

/** The two real devices, plus "system" for alerts the app raises about itself
 *  (e.g. the history recorder being down) rather than reading off a device. */
export type AlertSource = "dish" | "router" | "system";

export interface AlertState extends AlertSpec {
  active: boolean;
  /** Both devices use overlapping keys (e.g. thermalThrottle), so source disambiguates. */
  source: AlertSource;
}

/**
 * Conditions a host observes ABOUT a device rather than reads OFF one: a device
 * not answering can never appear in that device's own alert payload, because the
 * payload is what failed to arrive.
 *
 * Declared once, and used for both faces — the live alert and the history label.
 * They were two separate literals carrying the same wording, which is a rename
 * away from history and the alert panel describing the same event differently.
 *
 * A device that has stopped answering is critical and is raised the instant it
 * happens. Nothing here waits to see whether it recovers: a delay would mean the
 * connection status indicator showing "dish unreachable" while the alert panel
 * still said "no active alerts", and the whole point of an alert is that it
 * arrives when the thing goes wrong, not once it has been wrong for a while.
 */
export const SYSTEM_ALERTS = {
  dishUnreachable: {
    key: "dishUnreachable",
    ok: "A antena está respondendo",
    firing: "A antena não está respondendo",
    advice:
      "Verifique se a antena está ligada e se o cabo até o roteador está bem encaixado nas duas pontas.",
    severity: "critical",
    notify: true,
  },
  routerUnreachable: {
    key: "routerUnreachable",
    ok: "O roteador está respondendo",
    firing: "O roteador não está respondendo",
    severity: "warning",
    notify: true,
  },
  // The satellite side is down while the hardware here is fine — the dish is
  // powered and answering, its pings to the point of presence are not coming
  // back. It is a condition ABOUT the link rather than a flag either device
  // raises, so like unreachability it can never appear in a device's own alert
  // payload; something has to watch the drop rate and say so.
  starlinkOutage: {
    key: "starlinkOutage",
    ok: "Os pings para a rede Starlink voltaram a funcionar",
    firing: "A antena está alcançável, mas os pings para a rede Starlink estão falhando",
    advice:
      "Nada do seu lado está errado. Clima forte ou uma lacuna na cobertura de satélites resolve sozinho.",
    severity: "critical",
    notify: true,
  },
  // Recorded by the recorder about itself: a boot that finds its heartbeat
  // stale logs the gap, so History can say "not recorded" instead of implying
  // "nothing happened". Never fires live — historianDown covers the present.
  recorderOff: {
    key: "recorderOff",
    ok: "A gravação rodou sem interrupção",
    firing: "A gravação estava desligada — o que aconteceu neste intervalo não foi registrado",
    severity: "advisory",
  },
  // The historian being down is itself an alert: recording has silently stopped.
  // Only a host that reaches the historian across a boundary can observe it —
  // the desktop app runs it in-process, where its absence means the app is gone.
  historianDown: {
    key: "historianDown",
    ok: "Gravador de histórico em execução",
    firing:
      "Gravador de histórico parado — alertas ao vivo ainda funcionam, mas nada está sendo gravado",
    severity: "warning",
    notify: true,
  },
} satisfies Record<string, AlertSpec>;

/** A system definition as a firing alert. One definition, both faces. */
export function firingSystemAlert(spec: AlertSpec): AlertState {
  return { ...spec, source: "system", active: true };
}

/** Every definition, keyed "source:key" — the lookup history uses to put an
 *  alert's wording on a recorded episode. */
export const SPEC_BY_SOURCE_KEY = new Map<string, AlertSpec>([
  ...DISH_ALERTS.map((spec) => [`dish:${spec.key}`, spec] as const),
  ...ROUTER_ALERTS.map((spec) => [`router:${spec.key}`, spec] as const),
  ...Object.values(SYSTEM_ALERTS).map((spec) => [`system:${spec.key}`, spec] as const),
]);

/** Fold a device's raw alert booleans against its definitions. Absent = clear. */
export function resolveAlerts(
  specs: AlertSpec[],
  alerts: Record<string, boolean> | undefined,
  source: AlertSource,
): AlertState[] {
  return specs.map((spec) => ({ ...spec, source, active: alerts?.[spec.key] === true }));
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, advisory: 2 };

/** Active alerts first, worst first. */
export function sortBySeverity(states: AlertState[]): AlertState[] {
  return [...states].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
