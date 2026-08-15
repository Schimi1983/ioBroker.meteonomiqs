"use strict";
/*
 * ioBroker.meteonomiqs
 *
 * Weather forecast from wetter.com via the Meteonomiqs Public Weather API v4.0.
 * https://doc.meteonomiqs.com/doc/forecast_v4_0.html
 *
 * Design notes worth knowing before changing things:
 *
 *  - One API call returns summary + spaces + hourly. Every state this adapter
 *    creates comes out of that single response, so enabling more groups never
 *    costs additional quota.
 *  - Free plans are capped (100 calls/month by default). Fetches therefore carry
 *    a priority tier; when the budget gets tight the lowest tier drops out first
 *    instead of the adapter stalling for the rest of the month.
 *  - `current` is refreshed hourly from the already-written hourly states, not
 *    from the cached payload. That way it survives an adapter restart and never
 *    triggers a request.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const utils = __importStar(require("@iobroker/adapter-core"));
const fields_1 = require("./lib/fields");
const helpers_1 = require("./lib/helpers");
const scheduler_1 = require("./lib/scheduler");
const BASE_URL = 'https://forecast.meteonomiqs.com/v4_0';
const ICON_BASE_URL = 'https://cs3.wettercomassets.com/wcomv5/images/icons/weather';
const MAX_FORECAST_DAYS = 14;
const CLEANUP_UP_TO_DAY = 25;
const RETRY_DELAY_MS = 30000;
class WetterComAdapter extends utils.Adapter {
    timers = [];
    ensured = new Set();
    isFetching = false;
    authFailed = false;
    unloaded = false;
    constructor(options = {}) {
        super({ ...options, name: 'meteonomiqs' });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }
    // ---------------------------------------------------------------- lifecycle
    async onReady() {
        await this.setStateAsync('info.connection', { val: false, ack: true });
        const times = this.parseUpdateTimes();
        if (times.length === 0) {
            this.log.error('No valid update times configured. Please check the instance settings.');
            return;
        }
        this.validateSchedule(times);
        await this.ensureInfoStates();
        this.subscribeStates('info.force_update');
        this.subscribeStates('info.reset_counter');
        for (const entry of times) {
            const minutes = (0, helpers_1.timeToMinutes)(entry.time);
            if (minutes === null) {
                continue;
            }
            const handle = (0, scheduler_1.scheduleDaily)(this, Math.floor(minutes / 60), minutes % 60, () => {
                void this.fetchForecast('scheduled', entry.tier, entry.time);
            });
            this.timers.push(handle);
        }
        // Daily period roll so the counters flip over promptly in the UI. The
        // actual reset is additionally done lazily on every budget check, so a
        // host that was switched off at midnight does not break the counters.
        this.timers.push((0, scheduler_1.scheduleDaily)(this, 0, 1, () => void this.rollPeriods()));
        if (this.config.enableCurrent) {
            this.timers.push((0, scheduler_1.scheduleHourly)(this, 1, () => void this.updateCurrent('hourly')));
        }
        await this.fetchForecast('startup');
        // `current` must not depend on the startup fetch: that fetch is skipped
        // whenever the cooldown, the budget or a missing key says so.
        await this.updateCurrent('startup');
    }
    onUnload(callback) {
        try {
            this.unloaded = true;
            for (const timer of this.timers) {
                timer.cancel();
            }
            this.timers = [];
            void this.setState('info.connection', { val: false, ack: true });
        }
        catch {
            // nothing we can do at this point
        }
        finally {
            callback();
        }
    }
    onStateChange(id, state) {
        if (!state || state.ack || state.val !== true) {
            return;
        }
        if (id.endsWith('info.force_update')) {
            void this.setStateAsync('info.force_update', { val: false, ack: true });
            this.authFailed = false;
            this.log.info('Manual update triggered (bypasses the cooldown, the monthly limit still applies).');
            void this.fetchForecast('manual');
        }
        else if (id.endsWith('info.reset_counter')) {
            void this.setStateAsync('info.reset_counter', { val: false, ack: true });
            this.log.warn('Monthly request counter reset to 0 by user request.');
            void this.setStateAsync('info.requests_month', { val: 0, ack: true });
            void this.setStateAsync('info.requests_month_period', { val: (0, helpers_1.monthKey)(new Date()), ack: true });
        }
    }
    // ------------------------------------------------------------- configuration
    parseUpdateTimes() {
        const raw = Array.isArray(this.config.updateTimes) ? this.config.updateTimes : [];
        const result = [];
        for (const entry of raw) {
            const minutes = (0, helpers_1.timeToMinutes)(String(entry?.time ?? ''));
            if (minutes === null) {
                this.log.warn(`Ignoring invalid update time "${String(entry?.time)}" (expected HH:MM).`);
                continue;
            }
            const tier = Math.max(1, Math.round(Number(entry?.tier) || 1));
            result.push({ time: String(entry.time).trim(), tier });
        }
        return result;
    }
    get maxTier() {
        return this.parseUpdateTimes().reduce((max, entry) => Math.max(max, entry.tier), 1);
    }
    /**
     * Two checks that would otherwise only show up as "no data arrives":
     * is the cooldown shorter than the smallest gap between two fetches, and
     * does the chosen cadence fit into the monthly budget at all?
     *
     * @param times The configured update times with their priority tiers.
     */
    validateSchedule(times) {
        const minutes = times.map((t) => (0, helpers_1.timeToMinutes)(t.time)).filter((m) => m !== null);
        const plan = times.map((t) => `${t.time} (tier ${t.tier})`).join(' | ');
        this.log.info(`Update schedule: ${plan}`);
        const gap = (0, helpers_1.smallestGapHours)(minutes);
        const cooldown = Number(this.config.minHoursBetweenUpdates) || 0;
        if (times.length > 1 && cooldown >= gap) {
            this.log.error(`Configuration problem: the cooldown (${cooldown} h) is greater than or equal to the smallest gap between two update times (${gap.toFixed(1)} h). ` +
                'At least one fetch will always be skipped. Please lower "Minimum hours between updates".');
        }
        const perDay = this.maxTier;
        const limit = Number(this.config.monthlyLimit) || 0;
        const worstCase = perDay * 31;
        if (limit > 0 && worstCase > limit) {
            this.log.warn(`Budget warning: ${perDay} fetches per day add up to ${worstCase} calls in a 31-day month, but the limit is ${limit}. ` + 'The priority tiers will start dropping fetches towards the end of the month.');
        }
        else if (limit > 0) {
            this.log.info(`Budget: ${perDay} fetches/day = at most ${worstCase} calls/month out of ${limit} (${limit - worstCase} spare).`);
        }
    }
    async resolveLocation() {
        const system = await this.getForeignObjectAsync('system.config');
        const sysLang = system?.common?.language || 'en';
        const lang = String(this.config.language || '').trim() || sysLang;
        if (!this.config.useSystemLocation) {
            const lat = Number(this.config.latitude);
            const lon = Number(this.config.longitude);
            if (!isFinite(lat) || !isFinite(lon) || (lat === 0 && lon === 0)) {
                this.log.error('Manual coordinates are missing or invalid. Please check the instance settings.');
                return null;
            }
            return { lat: lat.toFixed(3), lon: lon.toFixed(3), lang };
        }
        const lat = Number(system?.common?.latitude);
        const lon = Number(system?.common?.longitude);
        if (!isFinite(lat) || !isFinite(lon)) {
            this.log.error('No location configured in the ioBroker system settings (Settings → System → Location).');
            return null;
        }
        return { lat: lat.toFixed(3), lon: lon.toFixed(3), lang };
    }
    // -------------------------------------------------------------- object tree
    groupEnabled(group) {
        switch (group) {
            case 'warn':
                return !!this.config.enableWarnings;
            case 'astro':
                return !!this.config.enableAstro;
            case 'extended':
                return !!this.config.enableExtended;
            case 'snow':
                return !!this.config.enableSnow;
            default:
                return true;
        }
    }
    async ensureChannel(id, name) {
        if (this.ensured.has(id)) {
            return;
        }
        const existing = await this.getObjectAsync(id);
        if (!existing) {
            await this.setObjectNotExistsAsync(id, { type: 'channel', common: { name }, native: {} });
        }
        else if (!WetterComAdapter.sameLabel(existing.common?.name, name)) {
            await this.extendObjectAsync(id, { common: { name } });
        }
        this.ensured.add(id);
    }
    async ensureState(id, name, type, role, unit, write = false) {
        if (this.ensured.has(id)) {
            return;
        }
        const common = { name, type, role, unit: unit || undefined, read: true, write };
        const existing = await this.getObjectAsync(id);
        if (!existing) {
            await this.setObjectNotExistsAsync(id, {
                type: 'state',
                common: { ...common, def: WetterComAdapter.initValue(type) },
                native: {},
            });
        }
        else {
            const c = existing.common ?? {};
            const drifted = !WetterComAdapter.sameLabel(c.name, name) || c.type !== type || c.role !== role || (c.unit || undefined) !== common.unit || c.read !== true || c.write !== write;
            if (drifted) {
                // Metadata is owned by the adapter. Without this, a corrected
                // label, role or unit would only ever reach fresh installations.
                await this.extendObjectAsync(id, { common });
                this.log.debug(`Updated object metadata: ${id}`);
            }
        }
        this.ensured.add(id);
    }
    /**
     * Compares two state labels, which may be a plain string or a translation map.
     *
     * @param a First label.
     * @param b Second label.
     * @returns True when both describe the same label.
     */
    static sameLabel(a, b) {
        return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
    }
    static initValue(type) {
        return type === 'number' ? 0 : type === 'boolean' ? false : '';
    }
    static coerce(raw, field) {
        if (field.type === 'number') {
            return (0, helpers_1.round)((0, helpers_1.extractValue)(raw), field.digits ?? 1);
        }
        if (field.type === 'boolean') {
            return !!raw;
        }
        if (typeof raw === 'string') {
            return raw;
        }
        if (typeof raw === 'number' || typeof raw === 'boolean') {
            return String(raw);
        }
        return '';
    }
    /**
     * Builds the bilingual state label.
     *
     * Both prefixes must be passed separately — a single prefix would put the
     * English wording into the German name.
     *
     * @param field Field definition carrying the English and German label.
     * @param prefixEn English label prefix, e.g. "Now: ".
     * @param prefixDe German label prefix, e.g. "Jetzt: ".
     * @returns See return type.
     */
    fieldName(field, prefixEn, prefixDe) {
        return { en: `${prefixEn}${field.name}`, de: `${prefixDe}${field.nameDe}` };
    }
    /**
     * Creates and writes all fields of a table in one place.
     *
     * @param basePath State prefix the fields are created under.
     * @param prefixEn English label prefix, e.g. "Day 0: ".
     * @param prefixDe German label prefix, e.g. "Tag 0: ".
     * @param fields The field table to render.
     * @param source API object the getters read from.
     * @param ctx Language, time zone and icon base URL.
     * @param buffer Collects the pending writes so they can be awaited together.
     */
    async renderFields(basePath, prefixEn, prefixDe, fields, source, ctx, buffer) {
        const active = fields.filter((f) => this.groupEnabled(f.group));
        for (const field of active) {
            await this.ensureState(`${basePath}.${field.id}`, { en: `${prefixEn}${field.name}`, de: `${prefixDe}${field.nameDe}` }, field.type, field.role, field.unit);
        }
        for (const field of active) {
            let raw;
            try {
                raw = field.get(source, ctx);
            }
            catch (e) {
                raw = null;
                this.log.debug(`Field "${field.id}" could not be read: ${String(e)}`);
            }
            buffer.push(this.setStateChangedAsync(`${basePath}.${field.id}`, { val: WetterComAdapter.coerce(raw, field), ack: true }));
        }
    }
    async ensureInfoStates() {
        const s = (id, en, de, type, role, unit, write = false) => this.ensureState(`info.${id}`, { en, de }, type, role, unit, write);
        await s('last_sync', 'Last update', 'Letztes Update', 'string', 'text');
        await s('last_sync_ts', 'Last update (timestamp)', 'Letztes Update (Timestamp)', 'number', 'value.time');
        await s('requests_month', 'Requests this month', 'Anfragen Monat', 'number', 'value');
        await s('requests_month_period', 'Billing month', 'Abrechnungsmonat', 'string', 'text');
        await s('requests_today', 'Requests today', 'Anfragen heute', 'number', 'value');
        await s('requests_today_date', 'Counting day', 'Zähltag', 'string', 'text');
        await s('requests_left', 'Remaining requests', 'Verbleibende Anfragen', 'number', 'value');
        await s('status', 'Status', 'Status', 'string', 'text');
        await s('last_error', 'Last error', 'Letzter Fehler', 'string', 'text');
        await s('forecast_date', 'Forecast issued (API)', 'Vorhersage erstellt (API)', 'string', 'date');
        await s('next_update', 'Next API update', 'Nächstes API-Update', 'string', 'date');
        await s('location', 'Location in use', 'Verwendeter Standort', 'string', 'text');
        await s('timezone', 'Time zone of the location', 'Zeitzone des Standorts', 'string', 'text');
        await s('elevation', 'Elevation', 'Höhe über NN', 'number', 'value', 'm');
        await s('force_update', 'Update now', 'Jetzt aktualisieren', 'boolean', 'button', undefined, true);
        await s('reset_counter', 'Reset monthly counter', 'Monatszähler zurücksetzen', 'boolean', 'button', undefined, true);
        if (this.config.enableJson) {
            await this.ensureState('forecast_json', { en: 'Forecast (JSON)', de: 'Vorhersage (JSON)' }, 'string', 'json');
            await this.ensureState('hourly_json', { en: 'Hourly values (JSON)', de: 'Stundenwerte (JSON)' }, 'string', 'json');
        }
    }
    // ------------------------------------------------------------------- budget
    async getNumber(id, fallback = 0) {
        const state = await this.getStateAsync(id);
        return state && state.val !== null && state.val !== undefined ? Number(state.val) : fallback;
    }
    /**
     * Resets the monthly and daily counters using period markers rather than a
     * midnight trigger — a host that is off at the turn of the month would
     * otherwise keep a stale counter and stall for the whole next month.
     */
    async rollPeriods() {
        const now = new Date();
        const month = (0, helpers_1.monthKey)(now);
        const storedMonth = await this.getStateAsync('info.requests_month_period');
        if (String(storedMonth?.val ?? '') !== month) {
            if (storedMonth?.val) {
                this.log.info(`New billing month detected (${String(storedMonth.val)} → ${month}). Monthly counter reset.`);
            }
            await this.setStateAsync('info.requests_month', { val: 0, ack: true });
            await this.setStateAsync('info.requests_month_period', { val: month, ack: true });
        }
        const day = (0, helpers_1.dayKey)(now);
        const storedDay = await this.getStateAsync('info.requests_today_date');
        if (String(storedDay?.val ?? '') !== day) {
            await this.setStateAsync('info.requests_today', { val: 0, ack: true });
            await this.setStateAsync('info.requests_today_date', { val: day, ack: true });
        }
    }
    async checkBudget(reason, tier, label) {
        await this.rollPeriods();
        const limit = Number(this.config.monthlyLimit) || 0;
        const usage = await this.getNumber('info.requests_month');
        if (limit > 0 && usage >= limit) {
            this.log.warn(`Monthly limit reached (${usage}/${limit}). Paused until the 1st of next month.`);
            await this.setStateAsync('info.status', { val: 'monthly limit reached', ack: true });
            return false;
        }
        const automatic = reason === 'scheduled' || reason === 'startup';
        if (!automatic) {
            return true;
        }
        const cooldown = Number(this.config.minHoursBetweenUpdates) || 0;
        const lastTs = await this.getNumber('info.last_sync_ts');
        if (cooldown > 0 && lastTs > 0) {
            const hours = (Date.now() - lastTs) / 3600000;
            if (hours < cooldown) {
                this.log.debug(`Fetch skipped (cooldown). Last fetch ${hours.toFixed(1)} h ago, minimum ${cooldown} h.`);
                return false;
            }
        }
        if (limit <= 0) {
            return true;
        }
        // A startup fetch is treated as the lowest priority so it can never eat
        // into the reserve that keeps the scheduled fetches alive.
        const effectiveTier = reason === 'startup' ? this.maxTier : tier;
        const verdict = (0, helpers_1.budgetAllows)(usage, limit, effectiveTier, new Date());
        if (!verdict.allowed) {
            if (verdict.mode === 'saving') {
                this.log.warn(`Saving mode: "${label}" skipped — the remaining budget no longer carries ${effectiveTier} fetches/day until the end of the month (${usage}/${limit}).`);
            }
            else if (verdict.mode === 'emergency') {
                this.log.warn(`Emergency mode: "${label}" skipped, budget critical (${usage}/${limit}). Fetching on even days only.`);
            }
            else {
                this.log.warn(`"${label}" skipped, monthly limit reached (${usage}/${limit}).`);
            }
        }
        return verdict.allowed;
    }
    async countRequest() {
        const limit = Number(this.config.monthlyLimit) || 0;
        await this.setStateAsync('info.requests_today', { val: (await this.getNumber('info.requests_today')) + 1, ack: true });
        const month = (await this.getNumber('info.requests_month')) + 1;
        await this.setStateAsync('info.requests_month', { val: month, ack: true });
        await this.setStateAsync('info.requests_left', { val: limit > 0 ? Math.max(0, limit - month) : 0, ack: true });
    }
    // -------------------------------------------------------------------- fetch
    async httpGetJson(url, apiKey, lang) {
        const timeoutMs = Math.max(5, Number(this.config.httpTimeout) || 20) * 1000;
        const controller = new AbortController();
        // this.setTimeout instead of the bare global: the adapter clears its own
        // timers on unload, and the repository checker asks for it (S5005).
        const timer = this.setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'x-api-key': apiKey, 'Accept-Language': lang, Accept: 'application/json' },
                signal: controller.signal,
            });
            const body = await response.text();
            return { status: response.status, body };
        }
        finally {
            this.clearTimeout(timer);
        }
    }
    async fetchForecast(reason, tier = 1, label = '') {
        if (this.isFetching || this.unloaded) {
            this.log.debug('Fetch already running or adapter shutting down — skipped.');
            return;
        }
        this.isFetching = true;
        try {
            await this.ensureInfoStates();
            if (this.authFailed && (reason === 'scheduled' || reason === 'startup')) {
                this.log.warn('Fetch skipped: the API key was rejected previously. Please correct it in the instance settings.');
                return;
            }
            const apiKey = String(this.config.apiKey || '').trim();
            if (apiKey.length < 10) {
                this.log.error('No valid API key configured. Get one at https://www.meteonomiqs.com and enter it in the instance settings.');
                await this.setStateAsync('info.status', { val: 'no API key', ack: true });
                return;
            }
            if (!(await this.checkBudget(reason, tier, label || reason))) {
                return;
            }
            const location = await this.resolveLocation();
            if (!location) {
                await this.setStateAsync('info.status', { val: 'no location', ack: true });
                return;
            }
            const forecastDays = Math.max(1, Math.min(Math.round(Number(this.config.forecastDays) || 7), MAX_FORECAST_DAYS));
            const url = `${BASE_URL}/forecast/${location.lat}/${location.lon}`;
            this.log.info(`Fetching forecast (${label || reason}) for ${location.lat}/${location.lon}, ${forecastDays} days.`);
            const maxRetries = Math.max(0, Math.round(Number(this.config.maxRetries) || 0));
            const reserve = Math.max(0, Number(this.config.reserveCalls) || 0);
            let payload = null;
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                let result = null;
                let networkError = null;
                try {
                    result = await this.httpGetJson(url, apiKey, location.lang);
                }
                catch (e) {
                    networkError = e;
                }
                // Retries must not eat the emergency reserve.
                const mayRetry = attempt < maxRetries && (await this.getNumber('info.requests_left', Number(this.config.monthlyLimit) || 0)) > reserve;
                if (networkError || !result) {
                    const message = networkError instanceof Error ? networkError.message : String(networkError);
                    this.log[mayRetry ? 'warn' : 'error'](`Network error: ${message}`);
                    await this.setStateAsync('info.last_error', { val: message, ack: true });
                    if (mayRetry) {
                        await this.delay(RETRY_DELAY_MS);
                        continue;
                    }
                    await this.setStateAsync('info.status', { val: 'network error', ack: true });
                    await this.setStateAsync('info.connection', { val: false, ack: true });
                    return;
                }
                // 401/403 are rejected by the gateway before metering, so they do not count.
                if (result.status !== 401 && result.status !== 403) {
                    await this.countRequest();
                }
                if (result.status === 429) {
                    this.log.error('API quota exhausted (HTTP 429). Setting the local counter to the configured limit.');
                    await this.setStateAsync('info.requests_month', { val: Number(this.config.monthlyLimit) || 0, ack: true });
                    await this.setStateAsync('info.status', { val: 'HTTP 429 — quota exhausted', ack: true });
                    return;
                }
                if (result.status === 401 || result.status === 403) {
                    this.authFailed = true;
                    this.log.error(`API key rejected (HTTP ${result.status}). Automatic fetches are paused until the key is changed.`);
                    await this.setStateAsync('info.status', { val: `HTTP ${result.status} — invalid key`, ack: true });
                    await this.setStateAsync('info.connection', { val: false, ack: true });
                    return;
                }
                if (result.status >= 500) {
                    this.log[mayRetry ? 'warn' : 'error'](`Server error HTTP ${result.status}.`);
                    if (mayRetry) {
                        await this.delay(RETRY_DELAY_MS);
                        continue;
                    }
                    await this.setStateAsync('info.status', { val: `HTTP ${result.status}`, ack: true });
                    return;
                }
                if (result.status !== 200) {
                    this.log.error(`Unexpected status code HTTP ${result.status}.`);
                    await this.setStateAsync('info.status', { val: `HTTP ${result.status}`, ack: true });
                    return;
                }
                try {
                    payload = JSON.parse(result.body);
                }
                catch {
                    this.log.error('The API response could not be parsed as JSON.');
                    await this.setStateAsync('info.status', { val: 'JSON parse error', ack: true });
                    return;
                }
                break;
            }
            if (!payload || !Array.isArray(payload.summary) || payload.summary.length === 0) {
                this.log.error('The API response contains no forecast data.');
                await this.setStateAsync('info.status', { val: 'empty response', ack: true });
                return;
            }
            this.authFailed = false;
            const now = new Date();
            await this.setStateAsync('info.last_sync', {
                val: `${(0, helpers_1.pad)(now.getDate())}.${(0, helpers_1.pad)(now.getMonth() + 1)}.${now.getFullYear()} ${(0, helpers_1.pad)(now.getHours())}:${(0, helpers_1.pad)(now.getMinutes())}`,
                ack: true,
            });
            await this.setStateAsync('info.last_sync_ts', { val: now.getTime(), ack: true });
            await this.processForecast(payload, location.lang, forecastDays);
            await this.setStateAsync('info.status', { val: 'ok', ack: true });
            await this.setStateAsync('info.last_error', { val: '', ack: true });
            await this.setStateAsync('info.connection', { val: true, ack: true });
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            this.log.error(`Unexpected error: ${message}`);
            await this.setStateAsync('info.last_error', { val: message, ack: true });
        }
        finally {
            this.isFetching = false;
        }
    }
    // ------------------------------------------------------------------ process
    async processForecast(data, lang, forecastDays) {
        const tz = data.location?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        const ctx = { lang, tz, iconBase: ICON_BASE_URL };
        await Promise.all([
            this.setStateChangedAsync('info.forecast_date', { val: String(data.forecastDate ?? ''), ack: true }),
            this.setStateChangedAsync('info.next_update', { val: String(data.nextUpdate ?? ''), ack: true }),
            this.setStateChangedAsync('info.timezone', { val: tz, ack: true }),
            this.setStateChangedAsync('info.location', {
                val: data.location?.coordinates ? `${data.location.coordinates.latitude}, ${data.location.coordinates.longitude}` : '',
                ack: true,
            }),
            this.setStateChangedAsync('info.elevation', { val: (0, helpers_1.round)((0, helpers_1.extractValue)(data.location?.coordinates?.elevation), 0), ack: true }),
        ]);
        const summary = data.summary ?? [];
        const maxDays = Math.min(summary.length, forecastDays);
        // Day sections are matched by date, not by array index — the two arrays
        // are not guaranteed to line up.
        const spacesByDate = new Map();
        for (const entry of data.spaces ?? []) {
            if (entry?.date) {
                spacesByDate.set(String(entry.date), entry);
            }
        }
        const hourlyByDate = new Map();
        for (const hour of data.hourly ?? []) {
            const parts = (0, helpers_1.localParts)(hour.from ?? hour.dateWithTimezone ?? hour.date, tz);
            const key = parts ? parts.date : String(hour.date ?? '');
            if (!key) {
                continue;
            }
            hour.__hour = parts ? parts.hour : '00';
            hour.__time = `${hour.__hour}:00`;
            const list = hourlyByDate.get(key) ?? [];
            list.push(hour);
            hourlyByDate.set(key, list);
        }
        const jsonDays = [];
        const jsonHours = [];
        const hourlyDays = Math.max(0, Math.min(Math.round(Number(this.config.hourlyDays) || 0), maxDays));
        for (let index = 0; index < maxDays; index++) {
            const day = summary[index];
            if (!day) {
                continue;
            }
            const dayKeyIso = String(day.date ?? '');
            const dayPath = `day_${index}`;
            const buffer = [];
            await this.ensureChannel(dayPath, { en: `Day ${index}`, de: `Tag ${index}` });
            await this.renderFields(dayPath, `Day ${index}: `, `Tag ${index}: `, fields_1.DAY_FIELDS, day, ctx, buffer);
            if (this.config.enableAstro && day.astronomy) {
                const astroPath = `${dayPath}.astro`;
                await this.ensureChannel(astroPath, { en: 'Sun & moon', de: 'Sonne & Mond' });
                await this.renderFields(astroPath, `Day ${index}: `, `Tag ${index}: `, fields_1.ASTRO_FIELDS, day.astronomy, ctx, buffer);
            }
            if (this.config.enableSpaces) {
                const spaceDay = spacesByDate.get(dayKeyIso);
                if (spaceDay) {
                    const spacesPath = `${dayPath}.spaces`;
                    await this.ensureChannel(spacesPath, { en: 'Day sections', de: 'Tagesabschnitte' });
                    for (const segment of fields_1.SPACE_SEGMENTS) {
                        const segmentData = spaceDay[segment];
                        if (!segmentData) {
                            continue;
                        }
                        const segmentPath = `${spacesPath}.${segment}`;
                        await this.ensureChannel(segmentPath, fields_1.SPACE_LABELS[segment]);
                        await this.renderFields(segmentPath, `Day ${index} ${fields_1.SPACE_LABELS[segment].en}: `, `Tag ${index} ${fields_1.SPACE_LABELS[segment].de}: `, fields_1.SPACE_FIELDS, segmentData, ctx, buffer);
                    }
                }
                else {
                    this.log.debug(`No day sections for ${dayKeyIso} in the API response.`);
                }
            }
            if (this.config.enableHourly && index < hourlyDays) {
                const hourlyPath = `${dayPath}.hourly`;
                await this.ensureChannel(hourlyPath, { en: 'Hourly', de: 'Stündlich' });
                const hours = hourlyByDate.get(dayKeyIso) ?? [];
                const delivered = new Set();
                for (const hour of hours) {
                    const label = hour.__hour ?? '00';
                    delivered.add(label);
                    const hourPath = `${hourlyPath}.${label}`;
                    await this.ensureChannel(hourPath, { en: `${label}:00`, de: `${label}:00 Uhr` });
                    await this.renderFields(hourPath, `Day ${index} ${label}:00: `, `Tag ${index} ${label}:00: `, fields_1.HOUR_FIELDS, hour, ctx, buffer);
                    if (this.config.enableJson && index === 0) {
                        jsonHours.push({
                            date: dayKeyIso,
                            time: hour.__time,
                            from: hour.from ?? '',
                            temp: (0, helpers_1.round)((0, helpers_1.extractValue)(hour.temperature), 1),
                            icon: (0, helpers_1.iconUrl)(hour.weather, ICON_BASE_URL, !!hour.isNight),
                            text: hour.weather?.text ?? '',
                            precProb: (0, helpers_1.round)((0, helpers_1.extractValue)(hour.prec?.probability), 0),
                            precSum: (0, helpers_1.round)((0, helpers_1.extractValue)(hour.prec?.sum), 2),
                            wind: (0, helpers_1.round)((0, helpers_1.extractValue)(hour.wind?.avg), 1),
                            gusts: (0, helpers_1.round)((0, helpers_1.extractValue)(hour.wind?.gusts), 1),
                            humidity: (0, helpers_1.round)((0, helpers_1.extractValue)(hour.relativeHumidity), 0),
                        });
                    }
                }
                // Hours no longer covered by the forecast keep their values but
                // are flagged, so bindings do not silently show stale data.
                for (let h = 0; h < 24; h++) {
                    const label = (0, helpers_1.pad)(h);
                    if (delivered.has(label)) {
                        continue;
                    }
                    const validId = `${hourlyPath}.${label}.valid`;
                    if (this.ensured.has(validId)) {
                        buffer.push(this.setStateChangedAsync(validId, { val: false, ack: true }));
                    }
                }
            }
            if (this.config.enableJson) {
                jsonDays.push({
                    day: index,
                    date: (0, helpers_1.formatDate)(day.date),
                    dateIso: dayKeyIso,
                    dayName: (0, helpers_1.getDayName)(day.date, lang),
                    tempMin: (0, helpers_1.round)((0, helpers_1.extractValue)(day.temperature?.min), 1),
                    tempMax: (0, helpers_1.round)((0, helpers_1.extractValue)(day.temperature?.max), 1),
                    text: day.weather?.text ?? '',
                    icon: (0, helpers_1.iconUrl)(day.weather, ICON_BASE_URL, false),
                    state: (0, helpers_1.round)((0, helpers_1.extractValue)(day.weather?.state), 0),
                    precProb: (0, helpers_1.round)((0, helpers_1.extractValue)(day.prec?.probability), 0),
                    precSum: (0, helpers_1.round)((0, helpers_1.extractValue)(day.prec?.sum), 2),
                    wind: (0, helpers_1.round)((0, helpers_1.extractValue)(day.wind?.avg), 1),
                    gusts: (0, helpers_1.round)((0, helpers_1.extractValue)(day.wind?.gusts), 1),
                    windDir: day.wind?.text ?? '',
                    sunHours: (0, helpers_1.round)((0, helpers_1.extractValue)(day.sunHours), 1),
                    clouds: (0, helpers_1.round)((0, helpers_1.cloudsPercent)(day.clouds), 0),
                    humidity: (0, helpers_1.round)((0, helpers_1.extractValue)(day.relativeHumidity), 0),
                    pressure: (0, helpers_1.round)((0, helpers_1.extractValue)(day.pressure), 0),
                    sunrise: (0, helpers_1.isoTime)(day.astronomy?.sunrise),
                    sunset: (0, helpers_1.isoTime)(day.astronomy?.sunset),
                    warnActive: !!day.highestWarning,
                    warnText: day.highestWarning?.text ?? '',
                    warnSeverity: (0, helpers_1.round)((0, helpers_1.extractValue)(day.highestWarning?.severityInt), 0),
                });
            }
            await Promise.all(buffer);
        }
        if (this.config.enableJson) {
            await Promise.all([this.setStateChangedAsync('forecast_json', { val: JSON.stringify(jsonDays), ack: true }), this.setStateChangedAsync('hourly_json', { val: JSON.stringify(jsonHours), ack: true })]);
        }
        await this.cleanupObsoleteDays(maxDays);
        await this.cleanupLegacySpaceFields(maxDays);
        await this.updateCurrent('after fetch');
        this.log.info(`Update finished: ${maxDays} days processed.`);
    }
    async cleanupObsoleteDays(activeDays) {
        for (let index = activeDays; index <= CLEANUP_UP_TO_DAY; index++) {
            const path = `day_${index}`;
            const existing = await this.getObjectAsync(path);
            if (!existing) {
                continue;
            }
            await this.delObjectAsync(path, { recursive: true });
            for (const cached of Array.from(this.ensured)) {
                if (cached === path || cached.startsWith(`${path}.`)) {
                    this.ensured.delete(cached);
                }
            }
            this.log.debug(`Removed obsolete day folder: ${path}`);
        }
    }
    /**
     * Removes the day-section states that older versions created under their
     * short names. Renaming them left the old ids behind as orphans, which show
     * up in the object tree and in history selections.
     *
     * @param activeDays Number of day folders currently in use.
     */
    async cleanupLegacySpaceFields(activeDays) {
        for (let index = 0; index < activeDays; index++) {
            for (const segment of fields_1.SPACE_SEGMENTS) {
                for (const legacy of fields_1.LEGACY_SPACE_FIELDS) {
                    const path = `day_${index}.spaces.${segment}.${legacy}`;
                    if (!(await this.getObjectAsync(path))) {
                        continue;
                    }
                    await this.delObjectAsync(path);
                    this.ensured.delete(path);
                    this.log.debug(`Removed renamed state: ${path}`);
                }
            }
        }
    }
    // ------------------------------------------------------------------ current
    /**
     * Fills `current.*` with the values of the hour in progress.
     *
     * The source is deliberately the already-written hourly states rather than
     * the cached payload: that way `current` still works right after an adapter
     * restart, without spending a request.
     *
     * The day is resolved through `date_iso` instead of a fixed index — between
     * midnight and the first fetch of the day, "today" still lives in day_1.
     *
     * @param reason What triggered the refresh; shown in the debug log.
     */
    async updateCurrent(reason) {
        if (!this.config.enableCurrent) {
            return;
        }
        if (!this.config.enableHourly || Number(this.config.hourlyDays) < 1) {
            this.log.warn('The "current" folder needs hourly values for at least one day. Please enable them in the instance settings.');
            return;
        }
        try {
            const base = 'current';
            await this.ensureChannel(base, { en: 'Current hour', de: 'Aktuelle Stunde' });
            const hourFields = fields_1.HOUR_FIELDS.filter((f) => this.groupEnabled(f.group));
            for (const field of hourFields) {
                await this.ensureState(`${base}.${field.id}`, this.fieldName(field, 'Now: ', 'Jetzt: '), field.type, field.role, field.unit);
            }
            for (const extra of fields_1.CURRENT_EXTRA) {
                if (extra.astro && !this.config.enableAstro) {
                    continue;
                }
                await this.ensureState(`${base}.${extra.id}`, this.fieldName(extra, 'Now: ', 'Jetzt: '), extra.type, extra.role, extra.unit);
            }
            await this.ensureState(`${base}.source`, { en: 'Now: source state', de: 'Jetzt: Quell-Datenpunkt' }, 'string', 'text');
            await this.ensureState(`${base}.updated`, { en: 'Now: last copied', de: 'Jetzt: zuletzt übernommen' }, 'string', 'text');
            const tzState = await this.getStateAsync('info.timezone');
            const tz = String(tzState?.val || '') || Intl.DateTimeFormat().resolvedOptions().timeZone;
            const now = (0, helpers_1.localParts)(new Date().toISOString(), tz);
            if (!now) {
                return;
            }
            let dayIndex = -1;
            const hourlyDays = Math.max(1, Math.round(Number(this.config.hourlyDays) || 1));
            for (let i = 0; i < hourlyDays; i++) {
                const state = await this.getStateAsync(`day_${i}.date_iso`);
                if (state && String(state.val) === now.date) {
                    dayIndex = i;
                    break;
                }
            }
            const buffer = [];
            const sourceHour = dayIndex >= 0 ? `day_${dayIndex}.hourly.${now.hour}` : '';
            if (!sourceHour || !(await this.getObjectAsync(`${sourceHour}.time`))) {
                buffer.push(this.setStateChangedAsync(`${base}.valid`, { val: false, ack: true }));
                await Promise.all(buffer);
                this.log.debug(`current: no hourly data available for ${now.date} ${now.hour}:00.`);
                return;
            }
            for (const field of hourFields) {
                await this.copyState(`${sourceHour}.${field.id}`, `${base}.${field.id}`, buffer);
            }
            for (const extra of fields_1.CURRENT_EXTRA) {
                if (extra.astro && !this.config.enableAstro) {
                    continue;
                }
                await this.copyState(`day_${dayIndex}.${extra.from}`, `${base}.${extra.id}`, buffer);
            }
            const stamp = new Date();
            buffer.push(this.setStateChangedAsync(`${base}.source`, { val: `${this.namespace}.${sourceHour}`, ack: true }), this.setStateAsync(`${base}.updated`, {
                val: `${(0, helpers_1.pad)(stamp.getDate())}.${(0, helpers_1.pad)(stamp.getMonth() + 1)}.${stamp.getFullYear()} ${(0, helpers_1.pad)(stamp.getHours())}:${(0, helpers_1.pad)(stamp.getMinutes())}`,
                ack: true,
            }));
            await Promise.all(buffer);
            this.log.debug(`current updated (${reason}): ${now.date} ${now.hour}:00 from day_${dayIndex}.`);
        }
        catch (e) {
            this.log.error(`current could not be updated: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    async copyState(from, to, buffer) {
        const state = await this.getStateAsync(from);
        if (!state || state.val === null || state.val === undefined) {
            return;
        }
        buffer.push(this.setStateChangedAsync(to, { val: state.val, ack: true }));
    }
}
if (require.main !== module) {
    module.exports = (options) => new WetterComAdapter(options);
}
else {
    (() => new WetterComAdapter())();
}
//# sourceMappingURL=main.js.map