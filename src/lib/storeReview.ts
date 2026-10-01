export type ReviewStore = "chrome" | "edge" | "firefox";

const STORE_NAME: Record<ReviewStore, string> = {
  chrome: "Chrome Web Store",
  edge: "Edge Add-ons",
  firefox: "Firefox Add-ons",
};

// Listings under the Painel Órbita brand are not published yet. Keep the
// shape so prompts can resume once store URLs are filled in.
const REVIEW_URL: Partial<Record<ReviewStore, string>> = {};

// Undefined in the web and Electron builds, which never define it.
function buildTarget(): string | undefined {
  return (import.meta.env as Record<string, string | undefined>).BROWSER;
}

export function reviewStore(): ReviewStore | null {
  if (typeof window !== "undefined" && window.dishlink) return null;
  // No store listing for this brand yet — skip the in-app review prompt.
  if (Object.keys(REVIEW_URL).length === 0) return null;

  const target = buildTarget();
  if (target === "firefox") return "firefox";
  if (target === "edge") return "edge";
  if (target !== "chrome") return null;

  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  return ua.includes("Edg/") ? "edge" : "chrome";
}

export function reviewStoreName(store: ReviewStore): string {
  return STORE_NAME[store];
}

export function reviewUrl(store: ReviewStore): string {
  const url = REVIEW_URL[store];
  if (!url) throw new Error(`No review URL configured for ${store}`);
  return url;
}
