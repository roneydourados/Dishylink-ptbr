// Firmware-update reboot timing, as the dish actually models it.
//
// `swupdate_reboot_hour` is a uint32, so the field will take any hour — but the
// official app offers exactly four choices (3, 9, 15, 21) and labels each as a
// SIX-HOUR WINDOW: "Overnight, around 3 AM · Between 12 AM and 6 AM". That
// wording is SpaceX telling us what the number means: the dish reboots somewhere
// inside the window, not on the hour. Offering 24 exact hours implied a
// precision the hardware does not have, and 20 of those values are ones their
// own app never writes.
//
// A dish that already holds an off-grid hour (set by an older client) is shown
// as the window that hour falls in, which is what the app does with it.

export interface UpdateWindow {
  /** The hour written to `swupdate_reboot_hour` for this window. */
  hour: number;
  /** "Overnight, around 3 AM" — the app's own phrasing. */
  label: string;
  /** "Between 12 AM and 6 AM". */
  range: string;
  /** Half-open [startHour, endHour) in local time. */
  startHour: number;
  endHour: number;
}

export const UPDATE_WINDOWS: UpdateWindow[] = [
  {
    hour: 3,
    label: "Madrugada, por volta das 3h",
    range: "Entre 0h e 6h",
    startHour: 0,
    endHour: 6,
  },
  {
    hour: 9,
    label: "Manhã, por volta das 9h",
    range: "Entre 6h e 12h",
    startHour: 6,
    endHour: 12,
  },
  {
    hour: 15,
    label: "Tarde, por volta das 15h",
    range: "Entre 12h e 18h",
    startHour: 12,
    endHour: 18,
  },
  {
    hour: 21,
    label: "Noite, por volta das 21h",
    range: "Entre 18h e 0h",
    startHour: 18,
    endHour: 24,
  },
];

/**
 * The window an hour belongs to. Anything outside 0–23 — a value the dish has
 * never reported, but the field is a uint32 — folds into the day rather than
 * falling through to a missing selection.
 */
export function updateWindowFor(hour: number | undefined): UpdateWindow {
  const normalized = ((Math.floor(hour ?? 3) % 24) + 24) % 24;
  return (
    UPDATE_WINDOWS.find(
      (window) => normalized >= window.startHour && normalized < window.endHour,
    ) ?? UPDATE_WINDOWS[0]
  );
}
