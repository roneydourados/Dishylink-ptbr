import { describe, expect, it } from "vitest";
import { formatServiceClass } from "./serviceClass";

describe("formatServiceClass", () => {
  it("separates roam from residential by mobility class", () => {
    expect(formatServiceClass("CONSUMER", "NOMADIC")).toBe("roam");
    expect(formatServiceClass("CONSUMER", "MOBILE")).toBe("roam");
    expect(formatServiceClass("CONSUMER", "STATIONARY")).toBe("residencial");
    expect(formatServiceClass("CONSUMER", undefined)).toBe("residencial");
  });

  it("names the business tiers", () => {
    expect(formatServiceClass("BUSINESS")).toBe("empresarial");
    expect(formatServiceClass("BUSINESS_PLUS")).toBe("empresarial plus");
  });

  it("keeps a business tier's name whatever the kit is licensed to do", () => {
    expect(formatServiceClass("BUSINESS", "MOBILE")).toBe("empresarial");
  });

  it("falls back to the raw tier, and to a dash when there is none", () => {
    expect(formatServiceClass("SOME_NEW_TIER")).toBe("some new tier");
    expect(formatServiceClass(undefined)).toBe("—");
  });
});
