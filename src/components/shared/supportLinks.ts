// Every outbound destination the support menu offers, kept apart from the menu
// that renders them: these are personal and financial addresses — a PIX key, a
// GitHub star, a mailto — and a wrong one still draws as a perfectly ordinary
// row, so the wrongness only ever shows up in where the money and mail actually
// went. Gathered here so the whole set can be read, and guarded, in one place.

const REPO = "https://github.com/roneydourados/starlink-monitor-br";

export const SUPPORT_LINKS = {
  starRepo: REPO,
  /** Chave PIX (e-mail) — copiar, não abrir como URL. */
  pixKey: "roneydourados@gmail.com",
  latestRelease: `${REPO}/releases/latest`,
  reportIssue: `${REPO}/issues/new?labels=bug`,
  requestFeature: `${REPO}/issues/new?labels=enhancement`,
  contact: "mailto:roneydourados@gmail.com",
  privacyPolicy: `${REPO}/blob/master/PRIVACY.md`,
  disclaimer: `${REPO}/blob/master/DISCLAIMER.md`,
};
