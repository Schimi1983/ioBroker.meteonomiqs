import { expect } from 'chai';
import { budgetAllows, cloudsPercent, dayLength, extractValue, formatDate, iconUrl, isoTime, localParts, parseApiDate, round, smallestGapHours, timeToMinutes } from './helpers';

const ICONS = 'https://cs3.wettercomassets.com/wcomv5/images/icons/weather';

describe('helpers', () => {
    describe('extractValue()', () => {
        it('returns plain numbers unchanged', () => {
            expect(extractValue(21)).to.equal(21);
            expect(extractValue(-3.5)).to.equal(-3.5);
        });

        it('unwraps the nested API value objects', () => {
            expect(extractValue({ value: 7 })).to.equal(7);
            expect(extractValue({ avg: 12.5 })).to.equal(12.5);
            expect(extractValue({ min: 1, max: 8, avg: 4 })).to.equal(4, 'avg wins over min/max');
            expect(extractValue({ value: null, avg: 3 })).to.equal(3, 'null members are skipped');
        });

        it('falls back to 0 for null, undefined and garbage', () => {
            expect(extractValue(null)).to.equal(0);
            expect(extractValue(undefined)).to.equal(0);
            expect(extractValue(NaN)).to.equal(0);
            expect(extractValue({})).to.equal(0);
            expect(extractValue('not a number')).to.equal(0);
        });
    });

    describe('parseApiDate()', () => {
        it('reads a bare YYYY-MM-DD as local midnight, not UTC', () => {
            const date = parseApiDate('2026-08-06');
            expect(date).to.not.equal(null);
            expect(date!.getFullYear()).to.equal(2026);
            expect(date!.getMonth()).to.equal(7);
            expect(date!.getDate()).to.equal(6, 'must not roll back a day west of UTC');
        });

        it('returns null for unusable input', () => {
            expect(parseApiDate('')).to.equal(null);
            expect(parseApiDate('nonsense')).to.equal(null);
        });
    });

    describe('formatDate()', () => {
        it('formats as DD.MM.YYYY', () => {
            expect(formatDate('2026-08-06')).to.equal('06.08.2026');
        });
    });

    describe('iconUrl()', () => {
        it('prefers the file name delivered by the API', () => {
            expect(iconUrl({ state: 63, icon: 'd_e_63.svg' }, ICONS)).to.equal(`${ICONS}/d_e_63.svg`);
            expect(iconUrl({ state: 0, icon: 'n_0.svg' }, ICONS)).to.equal(`${ICONS}/n_0.svg`, 'night icons must survive');
        });

        it('builds a fallback name only when the API omits the icon', () => {
            expect(iconUrl({ state: 1 }, ICONS)).to.equal(`${ICONS}/d_1.svg`);
            expect(iconUrl({ state: 1 }, ICONS, true)).to.equal(`${ICONS}/n_1.svg`);
            expect(iconUrl(null, ICONS)).to.equal(`${ICONS}/d_999.svg`);
        });
    });

    describe('cloudsPercent()', () => {
        it('uses avg for summary and space items', () => {
            expect(cloudsPercent({ min: 0, max: 37.5, avg: 12.5 })).to.equal(12.5);
        });

        it('converts hourly oktas into percent', () => {
            expect(cloudsPercent({ low: 0, middle: 37.5, high: 50, eights: 6 })).to.equal(75);
            expect(cloudsPercent({ eights: 8 })).to.equal(100);
        });
    });

    describe('localParts()', () => {
        it('resolves the hour in the location time zone, not the host time zone', () => {
            const parts = localParts('2026-08-06T12:00:00.000Z', 'Europe/Berlin');
            expect(parts).to.deep.equal({ date: '2026-08-06', hour: '14' });
        });

        it('crosses the date line correctly', () => {
            const parts = localParts('2026-08-06T12:30:00.000Z', 'Pacific/Auckland');
            expect(parts).to.deep.equal({ date: '2026-08-07', hour: '00' });
        });

        it('returns null for unusable timestamps', () => {
            expect(localParts('', 'Europe/Berlin')).to.equal(null);
            expect(localParts('nonsense', 'Europe/Berlin')).to.equal(null);
        });
    });

    describe('isoTime() and dayLength()', () => {
        it('extracts HH:MM from an offset-carrying ISO string', () => {
            expect(isoTime('2026-08-06T06:17:49+02:00')).to.equal('06:17');
            expect(isoTime(null)).to.equal('');
        });

        it('computes the day length', () => {
            expect(dayLength('2026-08-06T06:00:00+02:00', '2026-08-06T20:30:00+02:00')).to.equal(14.5);
            expect(dayLength(null, null)).to.equal(0);
        });
    });

    describe('timeToMinutes() and smallestGapHours()', () => {
        it('parses HH:MM and rejects nonsense', () => {
            expect(timeToMinutes('01:10')).to.equal(70);
            expect(timeToMinutes('18:40')).to.equal(1120);
            expect(timeToMinutes('25:00')).to.equal(null);
            expect(timeToMinutes('abc')).to.equal(null);
        });

        it('measures the smallest gap around the 24 h clock', () => {
            // 01:10 / 11:40 / 18:40 → 10.5 h, 7 h, 6.5 h
            const gap = smallestGapHours([70, 700, 1120]);
            expect(gap).to.equal(6.5);
        });

        it('detects the v2 scheduling bug: 04:15 and 15:15 are only 11 h apart', () => {
            expect(smallestGapHours([255, 915])).to.equal(11);
        });
    });

    describe('round()', () => {
        it('removes float noise and survives NaN', () => {
            expect(round(5.137, 2)).to.equal(5.14);
            expect(round(12.34567, 1)).to.equal(12.3);
            expect(round(NaN)).to.equal(0);
            expect(round(Infinity)).to.equal(0);
        });
    });

    describe('budgetAllows()', () => {
        const limit = 100;

        it('permits three fetches a day for a whole clean month', () => {
            let usage = 0;
            for (let day = 1; day <= 31; day++) {
                for (const tier of [1, 2, 3]) {
                    const verdict = budgetAllows(usage, limit, tier, new Date(2026, 7, day, 12));
                    if (verdict.allowed) {
                        usage++;
                    }
                }
            }
            expect(usage).to.equal(93);
        });

        it('never exceeds the limit, whatever the starting point', () => {
            for (const start of [0, 10, 20, 40, 70, 95]) {
                let usage = start;
                for (let day = 1; day <= 31; day++) {
                    for (const tier of [1, 2, 3]) {
                        if (budgetAllows(usage, limit, tier, new Date(2026, 7, day, 12)).allowed) {
                            usage++;
                        }
                    }
                }
                expect(usage).to.be.at.most(limit, `starting from ${start}`);
            }
        });

        it('drops the lowest priority first', () => {
            // 6 August → 26 days left including today.
            // tier 3 needs 78 more calls, tier 2 needs 52, tier 1 needs 26.
            const now = new Date(2026, 7, 6, 12);
            expect(budgetAllows(40, limit, 3, now).allowed).to.equal(false, 'tier 3 goes first');
            expect(budgetAllows(40, limit, 2, now).allowed).to.equal(true, 'tier 2 still fits');
            expect(budgetAllows(40, limit, 1, now).allowed).to.equal(true, 'tier 1 survives longest');
        });

        it('stops everything once the hard limit is reached', () => {
            const now = new Date(2026, 7, 8, 12);
            expect(budgetAllows(100, limit, 1, now)).to.deep.equal({ allowed: false, mode: 'limit' });
            expect(budgetAllows(120, limit, 1, now).allowed).to.equal(false);
        });

        it('treats a limit of 0 as "no limit configured"', () => {
            expect(budgetAllows(9999, 0, 3, new Date(2026, 7, 6, 12)).allowed).to.equal(true);
        });

        it('falls back to every other day instead of stopping completely', () => {
            expect(budgetAllows(95, limit, 1, new Date(2026, 7, 7, 12)).allowed).to.equal(false, 'odd day');
            expect(budgetAllows(95, limit, 1, new Date(2026, 7, 8, 12)).allowed).to.equal(true, 'even day');
        });
    });
});
