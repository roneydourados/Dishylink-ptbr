// A rule can measure bytes, a clock, or a timetable, and the card has one place
// to say so. What is asserted here is that each kind reads as itself — a
// timetabled rule must never be drawn against an allowance it does not have,
// and a device paused by its hours must not be reported as over its limit.

import { expect, describe, test, afterEach } from "vitest";
import { render, cleanup } from "vitest-browser-react";
import { TooltipProvider } from "../../ui/tooltip";
import type { Rule } from "../../../hooks/useRules";
import { RuleCard } from "./RuleCard";

const GB = 1_000_000_000;
const NOW = Date.now();

function rule(over: Partial<Rule> = {}): Rule {
  return {
    id: "kids",
    name: "Kids devices",
    memberKeys: ["1", "2", "3"],
    allocationBytes: 20 * GB,
    autoPause: true,
    cycle: { kind: "monthly", day: 1 },
    mode: "perMember",
    usageBytes: 5 * GB,
    capacityBytes: 60 * GB,
    members: [],
    memberCount: 3,
    paused: false,
    pausedCount: 0,
    reached: false,
    windowBlocked: false,
    periodEndMs: NOW + 5 * 86_400_000,
    periodStartMs: NOW - 86_400_000,
    countdownStartMs: NOW - 86_400_000,
    createdMs: NOW,
    ...over,
  };
}

const hours = {
  mode: "allow" as const,
  windows: [
    { weekdays: [1, 2, 3, 4, 5], startMinute: 16 * 60, endMinute: 20 * 60 },
    { weekdays: [0, 6], startMinute: 9 * 60, endMinute: 21 * 60 },
  ],
};

/** A timetable naming a weekday that is never today, so the rule is sitting the
 *  day out whenever this suite runs. */
const notToday = {
  mode: "allow" as const,
  windows: [
    { weekdays: [(new Date().getDay() + 3) % 7], startMinute: 16 * 60, endMinute: 20 * 60 },
  ],
};

const text = () => document.body.textContent ?? "";
const show = (over: Partial<Rule> = {}) =>
  render(
    <TooltipProvider>
      <RuleCard rule={rule(over)} onOpen={() => {}} />
    </TooltipProvider>,
  );

describe("RuleCard", () => {
  afterEach(cleanup);

  test("given: an allowance, should: read the spend against the limit", async () => {
    show();
    await expect.poll(text).toContain("Kids devices");
    expect(text()).toContain("3 dispositivos");
    expect(text()).toContain("Limite: 20 GB");
    expect(text()).toContain("Ativa");
  });

  // Whose allowance the figure is. Unqualified over several devices it reads as
  // what one device gets, which is the pooled figure's whole meaning inverted —
  // and the bar underneath measures a different thing in each mode.
  test("given: a per-member allowance, should: say the limit is each device's", async () => {
    show();
    await expect.poll(text).toContain("Limite: 20 GB cada");
  });

  test("given: a pooled allowance, should: say the limit is shared", async () => {
    show({ mode: "pooled" });
    await expect.poll(text).toContain("Limite: 20 GB compartilhada");
  });

  test("given: one device, should: qualify the limit as neither", async () => {
    show({ memberKeys: ["1"], memberCount: 1 });
    await expect.poll(text).toContain("Limite: 20 GB");
    expect(text()).not.toContain("cada");
    expect(text()).not.toContain("compartilhada");
  });

  test("given: a rule near its allowance, should: lead with how much is gone", async () => {
    show({ usageBytes: 18.5 * GB, capacityBytes: 20 * GB });
    await expect.poll(text).toContain("% usado");
    expect(text()).toContain("93% usado");
  });

  test("given: a timetable, should: list its hours rather than an allowance it has none of", async () => {
    show({ allocationBytes: 0, schedule: hours, windowEndMs: NOW + 3_600_000 });

    await expect.poll(text).toContain("Seg–Sex");
    expect(text()).toContain("16:00 – 20:00");
    expect(text()).toContain("Sáb–Dom");
    expect(text()).not.toContain("Limite:");
  });

  test("given: a device shut by its hours, should: say so rather than blame a limit", async () => {
    show({
      allocationBytes: 0,
      schedule: hours,
      paused: true,
      pausedCount: 3,
      windowBlocked: true,
      windowEndMs: NOW + 3_600_000,
    });

    await expect.poll(text).toContain("Pausado, fora da agenda");
    expect(text()).not.toContain("limite atingido");
    expect(text()).toContain("Abre em");
  });

  // One device out of bytes stops that device, not the rule. Reading the group
  // as paused turned a card sitting at 22 of 30 GB fully red while two of its
  // three devices were still online.
  test("given: one device of three paused, should: stay active and say how many", async () => {
    show({
      usageBytes: 22 * GB,
      capacityBytes: 30 * GB,
      allocationBytes: 10 * GB,
      paused: true,
      pausedCount: 1,
      reached: true,
    });

    await expect.poll(text).toContain("Ativa · 1 de 3 pausados");
    expect(text()).not.toContain("Pausado, limite atingido");
    expect(document.querySelector("[class*='status-critical']")).toBeNull();
  });

  // A weekday rule read on a Saturday allows nothing and blocks nothing, and
  // reporting that as "Active, closes in 1 day" reads as the hours shutting.
  test("given: a timetable that does not cover today, should: say it is not scheduled", async () => {
    show({ allocationBytes: 0, schedule: notToday, windowEndMs: NOW + 32 * 3_600_000 });

    await expect.poll(text).toContain("Sem agenda hoje");
    expect(text()).toContain("Retoma em");
    expect(text()).not.toContain("Ativa");
    expect(text()).not.toContain("Fecha em");
  });

  test("given: a rule over its allowance, should: name the limit as the reason", async () => {
    show({
      usageBytes: 20 * GB,
      capacityBytes: 20 * GB,
      paused: true,
      pausedCount: 3,
      reached: true,
    });
    await expect.poll(text).toContain("Pausado, limite atingido");
  });

  // The card and the rule's own status have to name the same subject. Leading
  // with the allowance here while the status leads with the hours is one rule
  // described two ways depending on which surface you opened.
  test("given: a timetable and an allowance, should: lead with the hours and still show the allowance", async () => {
    show({ schedule: hours, windowEndMs: NOW + 3_600_000 });

    await expect.poll(text).toContain("Seg–Sex");
    expect(text()).toContain("16:00 – 20:00");
    expect(text()).toContain("de 20 GB cada");
  });

  // What holds the device is not always what the rule is about.
  test("given: a timetable rule out of bytes inside its hours, should: blame the limit", async () => {
    show({
      schedule: hours,
      usageBytes: 60 * GB,
      paused: true,
      pausedCount: 3,
      reached: true,
      windowEndMs: NOW + 3_600_000,
    });

    await expect.poll(text).toContain("Pausado, limite atingido");
    expect(text()).not.toContain("fora da agenda");
  });

  test("given: a timer, should: count the clock down rather than show bytes", async () => {
    show({
      allocationBytes: 0,
      countdownMs: 2 * 3_600_000,
      countdownStartMs: NOW - 3_600_000,
    });

    await expect.poll(text).toContain("of 2h");
    expect(text()).toContain("1h");
    expect(text()).not.toContain("Limite:");
  });
});
