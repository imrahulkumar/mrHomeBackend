/**
 * Date math for repeating notification schedules. Schedules are stored as wall-clock values
 * (date 'YYYY-MM-DD', time 'HH:mm') in an IANA time zone, so "every day at 9:00" stays 9:00
 * local time regardless of where the server runs.
 */

const DAY_MS = 86_400_000;

export const isValidTimeZone = (timeZone) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
};

/** How far `timeZone` is ahead of UTC at `date`, in ms. */
function tzOffset(date, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
      .formatToParts(date)
      .map((p) => [p.type, Number(p.value)]),
  );
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - Math.floor(date.getTime() / 1000) * 1000;
}

/** The instant at which the clock in `timeZone` shows `date` `time`. */
export function zonedTime(date, time, timeZone) {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  return new Date(guess - tzOffset(new Date(guess), timeZone));
}

/** 'YYYY-MM-DD' of `instant` as seen in `timeZone`. */
export const localDate = (instant, timeZone) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(instant);

const toUtcDay = (date) => Date.UTC(...date.split('-').map((n, i) => Number(n) - (i === 1 ? 1 : 0)));
const addDays = (date, n) => new Date(toUtcDay(date) + n * DAY_MS).toISOString().slice(0, 10);
const daysBetween = (from, to) => Math.round((toUtcDay(to) - toUtcDay(from)) / DAY_MS);
const weekday = (date) => new Date(toUtcDay(date)).getUTCDay(); // 0 = Sunday

function runsOn(schedule, date) {
  if (date < schedule.startDate) return false;
  if (schedule.endDate && date > schedule.endDate) return false;
  switch (schedule.repeat) {
    case 'once': return date === schedule.startDate;
    case 'daily': return true;
    case 'alternate': return daysBetween(schedule.startDate, date) % 2 === 0;
    case 'weekly': return schedule.weekdays.includes(weekday(date));
    default: return false;
  }
}

/** First time the schedule fires strictly after `after`, or null if it never fires again. */
export function nextRun(schedule, after = new Date()) {
  const today = localDate(after, schedule.timezone);
  const from = schedule.startDate > today ? schedule.startDate : addDays(today, -1); // -1: zone edge cases
  for (let i = 0; i < 370; i++) {
    const date = addDays(from, i);
    if (schedule.endDate && date > schedule.endDate) return null;
    if (!runsOn(schedule, date)) continue;
    const at = zonedTime(date, schedule.time, schedule.timezone);
    if (at > after) return at;
  }
  return null;
}
