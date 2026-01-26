const DEFAULT_TAGLINE = "All your channels, one Farm Friend Terminal.";

const HOLIDAY_TAGLINES = {
  newYear:
    "New Year's Day: Fresh ledger, fresh lanes, same hard work done smarter.",
  lunarNewYear:
    "Lunar New Year: Good fortune for the fields and calm schedules.",
  christmas:
    "Christmas: Barn lights on, chores done early, family time protected.",
  eid: "Eid al-Fitr: Clear the queue, share the table, rest well.",
  diwali: "Diwali: Bright lights, clean tools, smooth handoffs.",
  easter: "Easter: New season, new plans, same steady hands.",
  hanukkah: "Hanukkah: Eight nights, steady routines, warm light.",
  halloween: "Halloween: Keep the lights on and the gates closed.",
  thanksgiving:
    "Thanksgiving: Grateful for good weather windows and reliable routines.",
  valentines: "Valentine's Day: Save time for the people who keep you going.",
} as const;

const TAGLINES: string[] = [
  "Fields online, plans in order.",
  "Quiet automation for loud days.",
  "From sunrise to shutdown, your work stays on track.",
  "Field notes, clean rows, fewer surprises.",
  "Schedules that adapt to weather and work.",
  "Research on demand, chores on autopilot.",
  "Keep the farm moving without extra screens.",
  "Text in, answers out, work done.",
  "A steady hand for messy weeks.",
  "Turn long checklists into short nights.",
  "Precision for the day, flexibility for the week.",
  "Make a plan, keep the plan, adjust fast.",
  "When time is tight, routines carry the load.",
  "Equipment ready, people ready, work ready.",
  "From soil to sale, stay organized.",
  "Weather windows used well.",
  "Fewer surprises at the gate.",
  "Legal, real estate, IT - lined up when you need them.",
  "One console for field, office, and shop.",
  "Keep the week moving even when the plan changes.",
  "Daily logs, clear decisions, calm nights.",
  "Trust the schedule, update the schedule.",
  "Less scrambling, more steady progress.",
  "Everything in one place, without the clutter.",
  "Record once, reuse often.",
  "Clear notes, clean handoffs.",
  "Never lose the details that matter.",
  "Long-running tasks without the long days.",
  "A quiet wand for the busy season.",
  "Operational calm, even on heavy weeks.",
  "Set the routine, keep the rhythm.",
  "Steady timing, steady outcomes.",
  HOLIDAY_TAGLINES.newYear,
  HOLIDAY_TAGLINES.lunarNewYear,
  HOLIDAY_TAGLINES.christmas,
  HOLIDAY_TAGLINES.eid,
  HOLIDAY_TAGLINES.diwali,
  HOLIDAY_TAGLINES.easter,
  HOLIDAY_TAGLINES.hanukkah,
  HOLIDAY_TAGLINES.halloween,
  HOLIDAY_TAGLINES.thanksgiving,
  HOLIDAY_TAGLINES.valentines,
];

type HolidayRule = (date: Date) => boolean;

const DAY_MS = 24 * 60 * 60 * 1000;

function utcParts(date: Date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

const onMonthDay =
  (month: number, day: number): HolidayRule =>
  (date) => {
    const parts = utcParts(date);
    return parts.month === month && parts.day === day;
  };

const onSpecificDates =
  (dates: Array<[number, number, number]>, durationDays = 1): HolidayRule =>
  (date) => {
    const parts = utcParts(date);
    return dates.some(([year, month, day]) => {
      if (parts.year !== year) return false;
      const start = Date.UTC(year, month, day);
      const current = Date.UTC(parts.year, parts.month, parts.day);
      return current >= start && current < start + durationDays * DAY_MS;
    });
  };

const inYearWindow =
  (
    windows: Array<{
      year: number;
      month: number;
      day: number;
      duration: number;
    }>,
  ): HolidayRule =>
  (date) => {
    const parts = utcParts(date);
    const window = windows.find((entry) => entry.year === parts.year);
    if (!window) return false;
    const start = Date.UTC(window.year, window.month, window.day);
    const current = Date.UTC(parts.year, parts.month, parts.day);
    return current >= start && current < start + window.duration * DAY_MS;
  };

const isFourthThursdayOfNovember: HolidayRule = (date) => {
  const parts = utcParts(date);
  if (parts.month !== 10) return false; // November
  const firstDay = new Date(Date.UTC(parts.year, 10, 1)).getUTCDay();
  const offsetToThursday = (4 - firstDay + 7) % 7; // 4 = Thursday
  const fourthThursday = 1 + offsetToThursday + 21; // 1st + offset + 3 weeks
  return parts.day === fourthThursday;
};

const HOLIDAY_RULES = new Map<string, HolidayRule>([
  [HOLIDAY_TAGLINES.newYear, onMonthDay(0, 1)],
  [
    HOLIDAY_TAGLINES.lunarNewYear,
    onSpecificDates(
      [
        [2025, 0, 29],
        [2026, 1, 17],
        [2027, 1, 6],
      ],
      1,
    ),
  ],
  [
    HOLIDAY_TAGLINES.eid,
    onSpecificDates(
      [
        [2025, 2, 30],
        [2025, 2, 31],
        [2026, 2, 20],
        [2027, 2, 10],
      ],
      1,
    ),
  ],
  [
    HOLIDAY_TAGLINES.diwali,
    onSpecificDates(
      [
        [2025, 9, 20],
        [2026, 10, 8],
        [2027, 9, 28],
      ],
      1,
    ),
  ],
  [
    HOLIDAY_TAGLINES.easter,
    onSpecificDates(
      [
        [2025, 3, 20],
        [2026, 3, 5],
        [2027, 2, 28],
      ],
      1,
    ),
  ],
  [
    HOLIDAY_TAGLINES.hanukkah,
    inYearWindow([
      { year: 2025, month: 11, day: 15, duration: 8 },
      { year: 2026, month: 11, day: 5, duration: 8 },
      { year: 2027, month: 11, day: 25, duration: 8 },
    ]),
  ],
  [HOLIDAY_TAGLINES.halloween, onMonthDay(9, 31)],
  [HOLIDAY_TAGLINES.thanksgiving, isFourthThursdayOfNovember],
  [HOLIDAY_TAGLINES.valentines, onMonthDay(1, 14)],
  [HOLIDAY_TAGLINES.christmas, onMonthDay(11, 25)],
]);

function isTaglineActive(tagline: string, date: Date): boolean {
  const rule = HOLIDAY_RULES.get(tagline);
  if (!rule) return true;
  return rule(date);
}

export interface TaglineOptions {
  env?: NodeJS.ProcessEnv;
  random?: () => number;
  now?: () => Date;
}

export function activeTaglines(options: TaglineOptions = {}): string[] {
  if (TAGLINES.length === 0) return [DEFAULT_TAGLINE];
  const today = options.now ? options.now() : new Date();
  const filtered = TAGLINES.filter((tagline) =>
    isTaglineActive(tagline, today),
  );
  return filtered.length > 0 ? filtered : TAGLINES;
}

export function pickTagline(options: TaglineOptions = {}): string {
  const env = options.env ?? process.env;
  const override = env?.CLAWDBOT_TAGLINE_INDEX;
  if (override !== undefined) {
    const parsed = Number.parseInt(override, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      const pool = TAGLINES.length > 0 ? TAGLINES : [DEFAULT_TAGLINE];
      return pool[parsed % pool.length];
    }
  }
  const pool = activeTaglines(options);
  const rand = options.random ?? Math.random;
  const index = Math.floor(rand() * pool.length) % pool.length;
  return pool[index];
}

export { TAGLINES, HOLIDAY_RULES, DEFAULT_TAGLINE };
