import { describe, expect, it } from "vitest";
import { SUPPORT_LINKS } from "./supportLinks";

// The expected values are written out in full rather than built from REPO the
// way the source builds them. Sharing that constant would make this pass no
// matter what REPO became — precisely the substitution worth catching. Spelled
// out, changing any link takes a second deliberate edit here.
//
// `toEqual` on the whole object rather than key by key, so a row that appears or
// disappears fails too.
describe("support menu links", () => {
  it("point where they are meant to", () => {
    expect(SUPPORT_LINKS).toEqual({
      starRepo: "https://github.com/roneydourados/starlink-monitor-br",
      pixKey: "roneydourados@gmail.com",
      latestRelease: "https://github.com/roneydourados/starlink-monitor-br/releases/latest",
      reportIssue:
        "https://github.com/roneydourados/starlink-monitor-br/issues/new?labels=bug",
      requestFeature:
        "https://github.com/roneydourados/starlink-monitor-br/issues/new?labels=enhancement",
      contact: "mailto:roneydourados@gmail.com",
      privacyPolicy:
        "https://github.com/roneydourados/starlink-monitor-br/blob/master/PRIVACY.md",
      disclaimer:
        "https://github.com/roneydourados/starlink-monitor-br/blob/master/DISCLAIMER.md",
    });
  });
});
