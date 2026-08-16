/**
 * Tests for the state definition tables.
 *
 * Two things are checked, and they fail for different reasons:
 *
 *  1. **Structure** — ids, labels, roles, types and units of every row. This is
 *     where the repository checker and the object structure check look, so a
 *     violation here becomes a `[E1008]` or `[W1001]` in a pull request.
 *  2. **Wiring** — every getter is run against one hand-built API response and
 *     compared with the value it must produce. The fixture deliberately uses a
 *     different number for every leaf, so a getter that reads `min` where it
 *     should read `max`, or `avg` where it should read `sum`, cannot pass.
 *
 * The expectations are written by hand from the API documentation, not captured
 * from a run — a test whose expectations come out of the code under test only
 * proves that nothing changed, not that anything is right.
 */

import { expect } from 'chai';
import { ASTRO_FIELDS, CURRENT_EXTRA, DAY_FIELDS, HOUR_FIELDS, LEGACY_SPACE_FIELDS, SPACE_FIELDS, SPACE_SEGMENTS } from './fields';
import { coerceValue } from './helpers';
import type { ApiAstronomy, ApiHourlyItem, ApiSpaceItem, ApiSummaryItem, FieldDef, RenderContext } from './types';

const CTX: RenderContext = { lang: 'de', tz: 'Europe/Berlin', iconBase: 'https://icons.example/weather' };

// ---------------------------------------------------------------- the fixture

/** One forecast day. Every leaf carries a value that appears nowhere else. */
const DAY: ApiSummaryItem = {
    date: '2026-08-16',
    from: '2026-08-15T22:00:00Z',
    to: '2026-08-16T22:00:00Z',
    period: 1440,
    sunHours: 7.4,
    rainyHours: 2.5,
    pressure: { avg: 1013 },
    relativeHumidity: { avg: 68 },
    clouds: { avg: 43.5 },
    weather: { state: 61, text: 'Regen', icon: 'd_e_61.svg' },
    prec: { sum: 4.75, probability: 80, class: 2, snow: 0.5, snowLine: 2100, freshSnowRangeMin: 1.5, freshSnowRangeMax: 3.5 },
    temperature: { min: 12.3, max: 24.7, avg: 18.4 },
    wind: { unit: 'km/h', direction: 'Südwestwind', text: 'SW', avg: 14.2, min: 5.1, max: 22.8, degree: 225, gusts: { value: 38.6, text: 'stark' }, significantWind: true },
    windchill: { min: 10.9, max: 23.1 },
    highestWarning: { group: 'Gewitter', text: 'Starkes Gewitter', severity: 'severe', severityInt: 3 },
    snowLine: { min: 1900, max: 2300 },
};

/** Sun and moon times, as the API delivers them: ISO with the location's offset. */
const ASTRO: ApiAstronomy = {
    dawn: '2026-08-16T05:44:00+02:00',
    sunrise: '2026-08-16T06:20:00+02:00',
    suntransit: '2026-08-16T13:38:00+02:00',
    sunset: '2026-08-16T20:57:00+02:00',
    dusk: '2026-08-16T21:33:00+02:00',
    moonrise: '2026-08-16T07:11:00+02:00',
    moontransit: '2026-08-16T15:44:00+02:00',
    moonset: '2026-08-16T21:05:00+02:00',
    moonphase: 2,
    moonzodiac: 6,
};

/** A night section. `weather.icon` is missing on purpose to exercise the fallback. */
const SPACE: ApiSpaceItem = {
    date: '2026-08-16',
    isNight: true,
    sunHours: 0.4,
    pressure: { avg: 1009 },
    relativeHumidity: { avg: 82 },
    clouds: { avg: 91.5 },
    weather: { state: 31, text: 'Nebel', icon: null },
    prec: { sum: 1.25, probability: 35, class: 1, freshSnowRangeMax: 2.5 },
    temperature: { min: 11.1, max: 15.6, avg: 13.2 },
    wind: { direction: 'Nordwind', text: 'N', avg: 6.7, max: 9.9, degree: 355, gusts: { value: 17.3 }, significantWind: false },
    windchill: { min: 9.4, max: 14.8 },
    highestWarning: { text: 'Dichter Nebel', severityInt: 1 },
    snowLine: { min: 2400, max: 2600 },
};

/** One hour. Cloud cover arrives in oktas here, not as a percentage. */
const HOUR: ApiHourlyItem = {
    date: '2026-08-16',
    dateWithTimezone: '2026-08-16T21:00:00+02:00',
    from: '2026-08-16T19:00:00Z',
    to: '2026-08-16T20:00:00Z',
    period: 60,
    freshSnow: 0.8,
    dewpoint: 9.7,
    weather: { state: 4, text: 'Bedeckt', icon: 'n_4.svg' },
    sunHours: 0.05,
    prec: { sum: 0.35, probability: 22, snowLine: 1750 },
    temperature: { avg: 16.9 },
    relativeHumidity: 74,
    pressure: 1006,
    clouds: { eights: 7 },
    wind: { direction: 'Ostwind', text: 'O', avg: 11.4, degree: 95, gusts: { value: 26.2 }, significantWind: true },
    windchill: 15.8,
    isNight: true,
    highestWarning: { text: 'Windböen', severityInt: 2 },
    __hour: '21',
    __time: '21:00',
};

// ----------------------------------------------------------- the expectations

const ICON = 'https://icons.example/weather';

const DAY_EXPECTED: Record<string, unknown> = {
    date: '16.08.2026',
    date_iso: '2026-08-16',
    day_name: 'Sonntag',
    temp_max: 24.7,
    temp_min: 12.3,
    temp_avg: 18.4,
    weather_state: 61,
    weather_text: 'Regen',
    weather_icon: `${ICON}/d_e_61.svg`,
    prec_probability: 80,
    prec_sum: 4.75,
    prec_class: 2,
    rainy_hours: 2.5,
    sun_hours: 7.4,
    clouds: 43.5,
    humidity: 68,
    wind_speed: 14.2,
    wind_speed_max: 22.8,
    wind_gusts: 38.6,
    wind_direction: 'Südwestwind',
    wind_direction_short: 'SW',
    wind_degree: 225,
    wind_significant: true,
    pressure: 1013,
    windchill_min: 10.9,
    windchill_max: 23.1,
    snow_sum: 0.5,
    fresh_snow_min: 1.5,
    fresh_snow_max: 3.5,
    snowline_min: 1900,
    snowline_max: 2300,
    warn_active: true,
    warn_group: 'Gewitter',
    warn_text: 'Starkes Gewitter',
    warn_severity: 'severe',
    warn_severity_int: 3,
};

const ASTRO_EXPECTED: Record<string, unknown> = {
    sunrise: '06:20',
    sunset: '20:57',
    dawn: '05:44',
    dusk: '21:33',
    suntransit: '13:38',
    sunrise_iso: '2026-08-16T06:20:00+02:00',
    sunset_iso: '2026-08-16T20:57:00+02:00',
    // 20:57 − 06:20 = 14 h 37 min = 14.6166… h
    day_length: 14.62,
    moonrise: '07:11',
    moonset: '21:05',
    moonphase: 2,
    moonphase_text: 'Zunehmender Sichelmond',
    moonzodiac: 6,
    moonzodiac_text: 'Jungfrau',
};

const SPACE_EXPECTED: Record<string, unknown> = {
    temp: 13.2,
    temp_min: 11.1,
    temp_max: 15.6,
    weather_state: 31,
    weather_text: 'Nebel',
    // no icon from the API and isNight → built from the state code with the n_ prefix
    weather_icon: `${ICON}/n_31.svg`,
    is_night: true,
    prec_prob: 35,
    prec_sum: 1.25,
    wind_speed: 6.7,
    wind_gusts: 17.3,
    wind_direction_short: 'N',
    wind_degree: 355,
    wind_significant: false,
    clouds: 91.5,
    humidity: 82,
    sun_hours: 0.4,
    pressure: 1009,
    windchill_min: 9.4,
    windchill_max: 14.8,
    snowline_min: 2400,
    snowline_max: 2600,
    fresh_snow_max: 2.5,
    warn_active: true,
    warn_text: 'Dichter Nebel',
    warn_severity_int: 1,
};

const HOUR_EXPECTED: Record<string, unknown> = {
    time: '21:00',
    from: '2026-08-16T19:00:00Z',
    valid: true,
    temp: 16.9,
    windchill: 15.8,
    weather_state: 4,
    weather_text: 'Bedeckt',
    weather_icon: `${ICON}/n_4.svg`,
    is_night: true,
    prec_prob: 22,
    prec_sum: 0.35,
    wind_speed: 11.4,
    wind_gusts: 26.2,
    wind_dir: 'Ostwind',
    wind_dir_short: 'O',
    wind_degree: 95,
    wind_significant: true,
    humidity: 74,
    // 7 oktas = 87.5 %
    clouds: 87.5,
    sun_hours: 0.05,
    pressure: 1006,
    dewpoint: 9.7,
    fresh_snow: 0.8,
    snowline: 1750,
    warn_active: true,
    warn_text: 'Windböen',
    warn_severity_int: 2,
};

// ------------------------------------------------------------------ structure

/**
 * Roles taken from the official ioBroker catalogue (`stateroles.md`).
 *
 * Four invented roles once produced roughly 290 `[E1008]` findings in the
 * repository check. Anything not in this list has to be looked up there first.
 */
const KNOWN_ROLES = new Set([
    'date',
    'date.sunrise',
    'date.sunset',
    'indicator',
    'indicator.alarm',
    'text',
    'value',
    'value.clouds',
    'value.direction.wind',
    'value.humidity',
    'value.precipitation',
    'value.precipitation.chance',
    'value.pressure',
    'value.severity',
    'value.speed.max.wind',
    'value.speed.wind',
    'value.speed.wind.gust',
    'value.temperature',
    'value.temperature.dewpoint',
    'value.temperature.max',
    'value.temperature.min',
    'weather.direction.wind',
    'weather.icon',
    'weather.state',
]);

const TABLES: [string, FieldDef[]][] = [
    ['DAY_FIELDS', DAY_FIELDS],
    ['ASTRO_FIELDS', ASTRO_FIELDS],
    ['SPACE_FIELDS', SPACE_FIELDS],
    ['HOUR_FIELDS', HOUR_FIELDS],
];

describe('fields — structure', () => {
    for (const [name, table] of TABLES) {
        describe(name, () => {
            it('has unique ids in snake_case', () => {
                const ids = table.map((f) => f.id);
                expect(new Set(ids).size).to.equal(ids.length, 'duplicate id');
                for (const id of ids) {
                    expect(id).to.match(/^[a-z][a-z0-9_]*$/, `${id} is not snake_case`);
                }
            });

            it('labels both languages', () => {
                for (const f of table) {
                    expect(f.name, `${f.id}.name`).to.be.a('string').and.not.equal('');
                    expect(f.nameDe, `${f.id}.nameDe`).to.be.a('string').and.not.equal('');
                }
            });

            it('uses roles from the ioBroker catalogue', () => {
                for (const f of table) {
                    expect(KNOWN_ROLES.has(f.role), `${f.id} uses unknown role "${f.role}"`).to.equal(true);
                }
            });

            it('puts unit and digits only on numbers', () => {
                for (const f of table) {
                    if (f.type !== 'number') {
                        expect(f.unit, `${f.id} has a unit but is ${f.type}`).to.equal(undefined);
                        expect(f.digits, `${f.id} has digits but is ${f.type}`).to.equal(undefined);
                    }
                }
            });

            it('produces the declared type', () => {
                for (const f of table) {
                    const value = coerceValue(f.get({}, CTX), f);
                    expect(typeof value, `${f.id}`).to.equal(f.type);
                }
            });

            it('survives an empty and a half-filled source', () => {
                for (const f of table) {
                    expect(() => f.get({}, CTX), `${f.id} on {}`).to.not.throw();
                    expect(() => f.get({ weather: null, wind: null, prec: null, temperature: null }, CTX), `${f.id} on nulls`).to.not.throw();
                }
            });
        });
    }

    it('keeps the day sections in order', () => {
        expect([...SPACE_SEGMENTS]).to.deep.equal(['morning', 'afternoon', 'evening', 'night']);
    });

    it('no longer carries the renamed day-section ids', () => {
        // `icon` and `text` became `weather_icon` and `weather_text` in 0.1.3.
        // Reintroducing them would resurrect the states cleanupLegacySpaceFields deletes.
        for (const legacy of LEGACY_SPACE_FIELDS) {
            expect(
                SPACE_FIELDS.some((f) => f.id === legacy),
                `${legacy} is back in SPACE_FIELDS`,
            ).to.equal(false);
        }
    });

    it('resolves every source referenced by the current folder', () => {
        const dayIds = new Set(DAY_FIELDS.map((f) => f.id));
        const astroIds = new Set(ASTRO_FIELDS.map((f) => f.id));
        for (const extra of CURRENT_EXTRA) {
            if (extra.astro) {
                expect(extra.from, `${extra.id}`).to.match(/^astro\./);
                expect(astroIds.has(extra.from.slice('astro.'.length)), `${extra.id} points at a missing astro field`).to.equal(true);
            } else {
                expect(dayIds.has(extra.from), `${extra.id} points at a missing day field`).to.equal(true);
            }
            expect(KNOWN_ROLES.has(extra.role), `${extra.id} uses unknown role "${extra.role}"`).to.equal(true);
        }
    });
});

// --------------------------------------------------------------------- wiring

/**
 * Looks a row up by id and fails loudly if the table no longer has it.
 *
 * @param table The field table to search.
 * @param id The field id.
 * @returns The matching row.
 */
function fieldById(table: FieldDef[], id: string): FieldDef {
    const found = table.find((f) => f.id === id);
    if (!found) {
        throw new Error(`no field "${id}" in the table`);
    }
    return found;
}

/**
 * Runs one table against the fixture.
 *
 * @param name Table name, used as the describe title.
 * @param table The field table.
 * @param source The fixture the getters read from.
 * @param expected One entry per field id.
 */
function checkValues(name: string, table: FieldDef[], source: unknown, expected: Record<string, unknown>): void {
    describe(name, () => {
        it('has an expectation for every field and no leftovers', () => {
            expect(table.map((f) => f.id).sort()).to.deep.equal(Object.keys(expected).sort());
        });

        for (const field of table) {
            it(`${field.id}`, () => {
                expect(coerceValue(field.get(source, CTX), field)).to.deep.equal(expected[field.id]);
            });
        }
    });
}

describe('fields — values', () => {
    checkValues('DAY_FIELDS', DAY_FIELDS, DAY, DAY_EXPECTED);
    checkValues('ASTRO_FIELDS', ASTRO_FIELDS, ASTRO, ASTRO_EXPECTED);
    checkValues('SPACE_FIELDS', SPACE_FIELDS, SPACE, SPACE_EXPECTED);
    checkValues('HOUR_FIELDS', HOUR_FIELDS, HOUR, HOUR_EXPECTED);

    it('falls back to the average when the API omits the wind maximum', () => {
        const field = fieldById(DAY_FIELDS, 'wind_speed_max');
        const withoutMax = { ...DAY, wind: { ...DAY.wind, max: null } };
        expect(coerceValue(field.get(withoutMax, CTX), field)).to.equal(14.2);
    });

    it('prefers the icon file name delivered by the API over the state code', () => {
        const field = fieldById(HOUR_FIELDS, 'weather_icon');
        expect(coerceValue(field.get(HOUR, CTX), field)).to.equal(`${ICON}/n_4.svg`);
        const withoutIcon = { ...HOUR, weather: { state: 4, text: 'Bedeckt' } };
        expect(coerceValue(field.get(withoutIcon, CTX), field)).to.equal(`${ICON}/n_4.svg`);
        const daytime = { ...withoutIcon, isNight: false };
        expect(coerceValue(field.get(daytime, CTX), field)).to.equal(`${ICON}/d_4.svg`);
    });

    it('translates the moon tables with the configured language', () => {
        const phase = fieldById(ASTRO_FIELDS, 'moonphase_text');
        const zodiac = fieldById(ASTRO_FIELDS, 'moonzodiac_text');
        const english: RenderContext = { ...CTX, lang: 'en' };
        expect(coerceValue(phase.get(ASTRO, english), phase)).to.equal('Waxing Crescent');
        expect(coerceValue(zodiac.get(ASTRO, english), zodiac)).to.equal('Virgo');
    });

    it('reports zero instead of a broken value when the API omits a block', () => {
        for (const [, table] of TABLES) {
            for (const field of table.filter((f) => f.type === 'number')) {
                expect(coerceValue(field.get({}, CTX), field), field.id).to.equal(0);
            }
        }
    });
});
