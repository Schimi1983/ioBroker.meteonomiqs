/**
 * Pure helper functions. No adapter dependency on purpose — everything in here
 * is directly unit-testable (see helpers.test.ts).
 */

import type { ApiWeather } from './types';

/**
 * pad.
 *
 * @param n See parameter type.
 * @returns See return type.
 */
export function pad(n: number | string): string {
    return String(n).padStart(2, '0');
}

/**
 * Rounds and swallows NaN/Infinity. Keeps float noise out of the states.
 *
 * @param value See parameter type.
 * @param digits See parameter type.
 * @returns See return type.
 */
export function round(value: number, digits = 1): number {
    if (typeof value !== 'number' || !isFinite(value)) {
        return 0;
    }
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
}

/**
 * Extracts a number from the API's nested value objects.
 * The API returns plain numbers in some places and `{value|avg|sum|max|min}`
 * objects in others, sometimes with null members.
 *
 * @param value See parameter type.
 * @returns See return type.
 */
export function extractValue(value: unknown): number {
    if (value === null || value === undefined) {
        return 0;
    }
    if (typeof value === 'number') {
        return isFinite(value) ? value : 0;
    }
    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        for (const key of ['value', 'avg', 'sum', 'max', 'min']) {
            if (obj[key] !== undefined && obj[key] !== null) {
                return extractValue(obj[key]);
            }
        }
        return 0;
    }
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

/**
 * Parses API date strings. A bare "YYYY-MM-DD" is deliberately interpreted as
 * LOCAL midnight — `new Date('2026-08-06')` would be UTC midnight and therefore
 * the previous day in every time zone west of UTC.
 *
 * @param input See parameter type.
 * @returns See return type.
 */
export function parseApiDate(input: string | Date | null | undefined): Date | null {
    if (!input) {
        return null;
    }
    if (input instanceof Date) {
        return isNaN(input.getTime()) ? null : input;
    }
    const text = String(input).trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(text);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats as DD.MM.YYYY.
 *
 * @param input See parameter type.
 * @returns See return type.
 */
export function formatDate(input: string | Date | null | undefined): string {
    const date = parseApiDate(input);
    return date ? `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}` : '';
}

/**
 * Weekday name in the given locale.
 *
 * @param input See parameter type.
 * @param locale See parameter type.
 * @returns See return type.
 */
export function getDayName(input: string | null | undefined, locale: string): string {
    const date = parseApiDate(input);
    if (!date) {
        return '';
    }
    try {
        return date.toLocaleDateString(locale, { weekday: 'long' });
    } catch {
        return date.toLocaleDateString('en', { weekday: 'long' });
    }
}

/**
 * Converts a UTC timestamp into the local date and hour AT THE FORECAST LOCATION.
 * Uses the time zone reported by the API, so the hourly states stay correct even
 * when the ioBroker host runs in a different time zone than the queried place.
 *
 * @param utcIso See parameter type.
 * @param tz See parameter type.
 * @returns See return type.
 */
export function localParts(utcIso: string | null | undefined, tz: string): { date: string; hour: string } | null {
    if (!utcIso) {
        return null;
    }
    const date = new Date(utcIso);
    if (isNaN(date.getTime())) {
        return null;
    }
    try {
        const parts: Record<string, string> = {};
        const formatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: tz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            hourCycle: 'h23',
        });
        for (const part of formatter.formatToParts(date)) {
            parts[part.type] = part.value;
        }
        const hour = parts.hour === '24' ? '00' : parts.hour;
        return { date: `${parts.year}-${parts.month}-${parts.day}`, hour };
    } catch {
        return {
            date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
            hour: pad(date.getHours()),
        };
    }
}

/**
 * Pulls "HH:MM" out of an ISO string that carries its own offset.
 *
 * @param iso See parameter type.
 * @returns See return type.
 */
export function isoTime(iso: string | null | undefined): string {
    const match = /T(\d{2}):(\d{2})/.exec(iso ?? '');
    return match ? `${match[1]}:${match[2]}` : '';
}

/**
 * Daylight duration in hours from sunrise and sunset.
 *
 * @param sunrise See parameter type.
 * @param sunset See parameter type.
 * @returns See return type.
 */
export function dayLength(sunrise: string | null | undefined, sunset: string | null | undefined): number {
    const a = new Date(sunrise ?? '');
    const b = new Date(sunset ?? '');
    if (isNaN(a.getTime()) || isNaN(b.getTime())) {
        return 0;
    }
    return round((b.getTime() - a.getTime()) / 3600000, 2);
}

/**
 * Full icon URL. Prefers the file name delivered by the API — it already accounts
 * for day/night (d_/n_), severe weather warnings (d_e_) and wind warnings (d_w_).
 * Building the name from the state code is only a fallback.
 *
 * @param weather See parameter type.
 * @param iconBase See parameter type.
 * @param isNight See parameter type.
 * @returns See return type.
 */
export function iconUrl(weather: ApiWeather | null | undefined, iconBase: string, isNight = false): string {
    const raw = weather && typeof weather.icon === 'string' ? weather.icon.trim() : '';
    const state = weather && weather.state !== undefined && weather.state !== null ? weather.state : 999;
    const file = raw !== '' ? raw : `${isNight ? 'n' : 'd'}_${state}.svg`;
    return `${iconBase}/${file}`;
}

/**
 * Cloud coverage as a percentage. Hourly data arrives in oktas (`eights`).
 *
 * @param clouds See parameter type.
 * @returns See return type.
 */
export function cloudsPercent(clouds: unknown): number {
    if (clouds === null || clouds === undefined) {
        return 0;
    }
    if (typeof clouds === 'number') {
        return clouds;
    }
    const obj = clouds as Record<string, unknown>;
    if (typeof obj.avg === 'number') {
        return obj.avg;
    }
    if (typeof obj.eights === 'number') {
        return round((obj.eights / 8) * 100, 1);
    }
    if (typeof obj.low === 'number' || typeof obj.middle === 'number' || typeof obj.high === 'number') {
        return Math.max(Number(obj.low) || 0, Number(obj.middle) || 0, Number(obj.high) || 0);
    }
    return extractValue(clouds);
}

/**
 * MOON_PHASE.
 */
export const MOON_PHASE: Record<string, string[]> = {
    de: ['', 'Neumond', 'Zunehmender Sichelmond', 'Zunehmender Halbmond', 'Zunehmender Dreiviertelmond', 'Vollmond', 'Abnehmender Dreiviertelmond', 'Abnehmender Halbmond', 'Abnehmender Sichelmond'],
    en: ['', 'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'],
    nl: ['', 'Nieuwe maan', 'Wassende maansikkel', 'Eerste kwartier', 'Wassende maan', 'Volle maan', 'Afnemende maan', 'Laatste kwartier', 'Afnemende maansikkel'],
    fr: ['', 'Nouvelle lune', 'Premier croissant', 'Premier quartier', 'Lune gibbeuse croissante', 'Pleine lune', 'Lune gibbeuse décroissante', 'Dernier quartier', 'Dernier croissant'],
    it: ['', 'Luna nuova', 'Luna crescente', 'Primo quarto', 'Gibbosa crescente', 'Luna piena', 'Gibbosa calante', 'Ultimo quarto', 'Luna calante'],
    es: ['', 'Luna nueva', 'Luna creciente', 'Cuarto creciente', 'Gibosa creciente', 'Luna llena', 'Gibosa menguante', 'Cuarto menguante', 'Luna menguante'],
    pl: ['', 'Nów', 'Sierp przybywający', 'Pierwsza kwadra', 'Garb przybywający', 'Pełnia', 'Garb ubywający', 'Ostatnia kwadra', 'Sierp ubywający'],
    pt: ['', 'Lua nova', 'Lua crescente', 'Quarto crescente', 'Gibosa crescente', 'Lua cheia', 'Gibosa minguante', 'Quarto minguante', 'Lua minguante'],
    ru: ['', 'Новолуние', 'Растущий серп', 'Первая четверть', 'Растущая луна', 'Полнолуние', 'Убывающая луна', 'Последняя четверть', 'Убывающий серп'],
    uk: ['', 'Молодий місяць', 'Зростаючий серп', 'Перша чверть', 'Зростаючий місяць', 'Повний місяць', 'Спадний місяць', 'Остання чверть', 'Спадний серп'],
    'zh-cn': ['', '新月', '娥眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月'],
};

/**
 * MOON_ZODIAC.
 */
export const MOON_ZODIAC: Record<string, string[]> = {
    de: ['', 'Widder', 'Stier', 'Zwillinge', 'Krebs', 'Löwe', 'Jungfrau', 'Waage', 'Skorpion', 'Schütze', 'Steinbock', 'Wassermann', 'Fische'],
    en: ['', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
    nl: ['', 'Ram', 'Stier', 'Tweelingen', 'Kreeft', 'Leeuw', 'Maagd', 'Weegschaal', 'Schorpioen', 'Boogschutter', 'Steenbok', 'Waterman', 'Vissen'],
    fr: ['', 'Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'],
    it: ['', 'Ariete', 'Toro', 'Gemelli', 'Cancro', 'Leone', 'Vergine', 'Bilancia', 'Scorpione', 'Sagittario', 'Capricorno', 'Acquario', 'Pesci'],
    es: ['', 'Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'],
    pl: ['', 'Baran', 'Byk', 'Bliźnięta', 'Rak', 'Lew', 'Panna', 'Waga', 'Skorpion', 'Strzelec', 'Koziorożec', 'Wodnik', 'Ryby'],
    pt: ['', 'Carneiro', 'Touro', 'Gémeos', 'Caranguejo', 'Leão', 'Virgem', 'Balança', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'],
    ru: ['', 'Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'],
    uk: ['', 'Овен', 'Телець', 'Близнюки', 'Рак', 'Лев', 'Діва', 'Терези', 'Скорпіон', 'Стрілець', 'Козоріг', 'Водолій', 'Риби'],
    'zh-cn': ['', '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'],
};

/**
 * lookupTable.
 *
 * @param table See parameter type.
 * @param lang See parameter type.
 * @param index See parameter type.
 * @returns See return type.
 */
export function lookupTable(table: Record<string, string[]>, lang: string, index: unknown): string {
    const key = String(lang || 'en').toLowerCase();
    const list = table[key] || table[key.slice(0, 2)] || table.en;
    const i = Number(index);
    return Number.isInteger(i) && i > 0 && i < list.length ? list[i] : '';
}

/**
 * "HH:MM" → minutes since midnight, or null if malformed.
 *
 * @param time See parameter type.
 * @returns See return type.
 */
export function timeToMinutes(time: string): number | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(time).trim());
    if (!match) {
        return null;
    }
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h < 0 || h > 23 || m < 0 || m > 59) {
        return null;
    }
    return h * 60 + m;
}

/**
 * Smallest gap in hours between the given times, measured around the 24 h clock.
 *
 * @param times See parameter type.
 * @returns See return type.
 */
export function smallestGapHours(times: number[]): number {
    if (times.length < 2) {
        return 24;
    }
    const sorted = [...times].sort((a, b) => a - b);
    let min = 24 * 60;
    for (let i = 0; i < sorted.length; i++) {
        const next = sorted[(i + 1) % sorted.length];
        const raw = next - sorted[i];
        min = Math.min(min, raw > 0 ? raw : raw + 1440);
    }
    return min / 60;
}

/**
 * Deterministic per-installation offset in minutes, within `spread` either way.
 *
 * Every installation runs the same default fetch times, so without an offset a
 * few hundred adapters would hit the API in the same minute. The offset is
 * derived from a stable seed (the ioBroker installation UUID) rather than drawn
 * at random: it must survive restarts, or the cooldown would see a moved
 * schedule and skip fetches.
 *
 * FNV-1a is used because it is short, has no dependencies and spreads short
 * strings evenly — no cryptographic property is needed here.
 *
 * @param seed Stable identifier of the installation.
 * @param spread Maximum deviation in minutes, in both directions.
 * @returns Offset in minutes, between -spread and +spread.
 */
export function scheduleOffsetMinutes(seed: string, spread: number): number {
    if (spread <= 0) {
        return 0;
    }
    let hash = 0x811c9dc5;
    for (let i = 0; i < seed.length; i++) {
        hash ^= seed.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    const span = spread * 2 + 1;
    return (hash % span) - spread;
}

/**
 * Shifts a time given in minutes since midnight, wrapping around the 24 h clock.
 *
 * @param minutes Minutes since midnight.
 * @param offset Offset in minutes, may be negative.
 * @returns Minutes since midnight, always between 0 and 1439.
 */
export function shiftMinutes(minutes: number, offset: number): number {
    return (((minutes + offset) % 1440) + 1440) % 1440;
}

/**
 * monthKey.
 *
 * @param date See parameter type.
 * @returns See return type.
 */
export function monthKey(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/**
 * dayKey.
 *
 * @param date See parameter type.
 * @returns See return type.
 */
export function dayKey(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Decides whether a fetch of the given priority tier fits into the remaining
 * monthly budget.
 *
 * A tier-N fetch is only allowed while the budget still carries N calls per day
 * until the end of the month. When it gets tight the lowest priority drops out
 * first; tier 1 falls back to every other day rather than stopping entirely.
 *
 * @param usage Calls already spent this month.
 * @param limit Monthly allowance; 0 disables the check.
 * @param tier Priority of the fetch being considered.
 * @param now Reference point for the remaining days of the month.
 * @returns Whether the fetch may run, plus the mode that decided it.
 */
export function budgetAllows(usage: number, limit: number, tier: number, now: Date): { allowed: boolean; mode: 'ok' | 'saving' | 'emergency' | 'limit' } {
    // The hard cap lives here on purpose: a caller that only asks this function
    // must not be able to blow past the monthly limit.
    if (limit > 0 && usage >= limit) {
        return { allowed: false, mode: 'limit' };
    }

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();
    const needed = tier * (daysLeft + 1);

    if (limit <= 0 || usage + needed <= limit) {
        return { allowed: true, mode: 'ok' };
    }
    if (tier > 1) {
        return { allowed: false, mode: 'saving' };
    }
    // Tier 1 is the last one standing: rather every other day than not at all.
    return { allowed: now.getDate() % 2 === 0, mode: 'emergency' };
}
