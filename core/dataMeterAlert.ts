// The announcement a spent data limit raises.
//
// Its key names one subject, so no static definition can carry the wording and
// every host builds the spec here instead. Three of them announce the same trip
// under the same key — two recorders and the window — and history renders what
// was stored while a live panel renders what it computes, so a difference in
// wording between hosts reads back as two different events.
//
// The rule itself is the argument, not the figures off it: which key it is filed
// under, whether it measures bytes or a clock, and whether it speaks for a device
// or a group are all answerable from the rule, and a host left to assemble them
// is a host that can assemble them differently.

import type { AlertSpec } from "./alertDefinitions";
import {
  announcementSubject,
  announcesAsGroup,
  formatAllowance,
  formatDuration,
  type MeterRule,
} from "./dataMeter";

/** Offered as the advice on a rule that asked for a pause this host cannot send. */
export const CONNECT_ACCOUNT_ADVICE =
  "Conecte sua conta Starlink para o Dishylink pausar um dispositivo ao atingir a franquia.";

export function dataLimitAlertKey(clientKey: string): string {
  return `dataLimit:${clientKey}`;
}

export function dataLimitAlertSpec(
  rule: MeterRule,
  deviceName: string,
  options: {
    /** Shown on the ⓘ; omitted when nothing is left for the user to do. */
    advice?: string;
    /** The group's name, when the group covers more than this one device. Absent
     *  on a group down to a single member, which is just that device. */
    groupName?: string;
  } = {},
): AlertSpec {
  // Filed under the group either way, so the episode matches whatever the
  // recorder opened; only the wording turns on there being others to speak for.
  const asGroup = announcesAsGroup(rule) && options.groupName !== undefined;
  const subject = options.groupName ?? deviceName;
  // A countdown measures the clock and carries no allowance worth naming; saying
  // it reached a byte figure describes a limit it never had.
  const timing = rule.countdownMs !== undefined;
  return {
    key: dataLimitAlertKey(announcementSubject(rule)),
    ok: timing
      ? asGroup
        ? `${subject} ainda têm tempo`
        : `${subject} ainda tem tempo`
      : asGroup
        ? `${subject} estão dentro da franquia de dados`
        : `${subject} está dentro da franquia de dados`,
    firing: timing
      ? asGroup
        ? `${subject} esgotaram o timer de ${formatDuration(rule.countdownMs!)}`
        : `${subject} esgotou o timer de ${formatDuration(rule.countdownMs!)}`
      : asGroup
        ? `${subject} atingiram a franquia de ${formatAllowance(rule.allocationBytes)}`
        : `${subject} atingiu a franquia de ${formatAllowance(rule.allocationBytes)}`,
    advice: options.advice,
    severity: "warning",
    notify: true,
    // Retires on a timer, so `ok` would claim a device is within its allowance
    // while it is still capped.
    notifyClear: false,
  };
}
