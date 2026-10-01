export const GITHUB = "https://github.com/roneydourados/starlink-monitor-br";
export const RELEASES = `${GITHUB}/releases/latest`;
export const ISSUES = `${GITHUB}/issues`;
export const PRIVACY = `${GITHUB}/blob/master/PRIVACY.md`;

/** Contato e chave PIX (e-mail). */
export const EMAIL = "roneydourados@gmail.com";
export const PIX_KEY = "roneydourados@gmail.com";

/** null = listing not published yet; the UI renders a disabled control instead. */
export const STORES: Record<string, string | null> = {
  chrome: null,
  edge: null,
  firefox: null,
};

export interface DownloadOption {
  id: string;
  label: string;
  href: string | null;
  fileType: string;
  size: string | null;
  logo?: string;
}

export interface DownloadPlatform {
  id: string;
  label: string;
  icon: "windows" | "apple" | "browsers";
  choiceLabel: string;
  requirement: string;
  options: DownloadOption[];
}

interface ReleaseAsset {
  name: string;
  size: number;
  browser_download_url: string;
}

// Read from the newest *published* release rather than package.json: the version
// is bumped and pushed before the draft is published, so package.json names
// assets that do not exist yet and every download button would 404.
async function fetchLatestRelease(): Promise<{ tag: string; assets: ReleaseAsset[] } | null> {
  try {
    const response = await fetch(
      "https://api.github.com/repos/roneydourados/starlink-monitor-br/releases/latest",
      { headers: { accept: "application/vnd.github+json" } },
    );
    if (!response.ok) return null;
    const release = await response.json();
    if (typeof release?.tag_name !== "string") return null;
    return { tag: release.tag_name, assets: Array.isArray(release.assets) ? release.assets : [] };
  } catch {
    return null;
  }
}

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 * 10
    ? `${Math.round(bytes / 1024 / 1024)} MB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function downloadPlatforms(fallbackVersion: string): Promise<{
  version: string;
  platforms: DownloadPlatform[];
}> {
  const release = await fetchLatestRelease();
  const version = release ? release.tag.replace(/^v/, "") : fallbackVersion;
  const assets = release?.assets ?? [];

  // Matched by shape rather than by rebuilding the filename, so a change to
  // electron-builder's artifactName cannot silently produce dead buttons.
  const find = (pattern: RegExp): ReleaseAsset | undefined =>
    assets.find((asset) => pattern.test(asset.name));

  const option = (
    id: string,
    label: string,
    pattern: RegExp,
    fileType: string,
    fallbackName: string,
  ): DownloadOption => {
    const asset = find(pattern);
    return {
      id,
      label,
      fileType,
      href:
        asset?.browser_download_url ?? `${GITHUB}/releases/download/v${version}/${fallbackName}`,
      size: asset ? formatSize(asset.size) : null,
    };
  };

  const storeOption = (id: string, label: string, pattern: RegExp): DownloadOption => {
    const asset = find(pattern);
    return {
      id,
      label,
      logo: `/browsers/${id}.svg`,
      fileType: STORES[id] ? "Store" : "ZIP",
      href: STORES[id] ?? asset?.browser_download_url ?? null,
      size: STORES[id] ? null : asset ? formatSize(asset.size) : null,
    };
  };

  // Installer productName is ASCII ("Painel Orbita") — see electron-builder.yml.
  const productFile = "Painel Orbita";

  return {
    version,
    platforms: [
      {
        id: "macos",
        label: "macOS",
        icon: "apple",
        choiceLabel: "CPU architecture",
        requirement: "macOS 12 or later",
        options: [
          option("arm64", "ARM64", /-arm64\.dmg$/, "DMG", `${productFile}-${version}-arm64.dmg`),
          option("x64", "x64", /-x64\.dmg$/, "DMG", `${productFile}-${version}-x64.dmg`),
        ],
      },
      {
        id: "windows",
        label: "Windows",
        icon: "windows",
        choiceLabel: "CPU architecture",
        requirement: "Windows 10 or later",
        options: [
          option(
            "universal",
            "Universal",
            /^Painel Orbita-[\d.]+\.exe$/,
            "EXE",
            `${productFile}-${version}.exe`,
          ),
          option("x64", "x64", /-x64\.exe$/, "EXE", `${productFile}-${version}-x64.exe`),
          option("arm64", "ARM64", /-arm64\.exe$/, "EXE", `${productFile}-${version}-arm64.exe`),
        ],
      },
      {
        id: "web",
        label: "Browser",
        icon: "browsers",
        choiceLabel: "Browser",
        requirement: "Chrome 144+, Edge, Firefox",
        options: [
          storeOption("chrome", "Chrome", /-chrome\.zip$/),
          storeOption("edge", "Edge", /-edge\.zip$/),
          storeOption("firefox", "Firefox", /-firefox\.zip$/),
        ],
      },
    ],
  };
}

export const SITE = {
  name: "Painel Órbita",
  domain: "github.com/roneydourados/starlink-monitor-br",
  tagline: "Saiba exatamente o que sua antena está fazendo",
};
