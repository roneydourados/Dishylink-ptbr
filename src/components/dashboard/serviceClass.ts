/** Plan tier, in the vocabulary the Starlink app uses. CONSUMER covers both
 *  "Residential" on a fixed install and "Roam" on a kit licensed to move, so the
 *  mobility class is what tells those two apart. Absent mobility means
 *  STATIONARY: proto3 drops the zero value, so a fixed kit never sends it. */
export function formatServiceClass(classOfService?: string, mobilityClass?: string): string {
  switch (classOfService) {
    case "CONSUMER":
      return mobilityClass === "NOMADIC" || mobilityClass === "MOBILE" ? "roam" : "residencial";
    case "BUSINESS":
      return "empresarial";
    case "BUSINESS_PLUS":
      return "empresarial plus";
    default:
      return (classOfService ?? "—").replaceAll("_", " ").toLowerCase();
  }
}
