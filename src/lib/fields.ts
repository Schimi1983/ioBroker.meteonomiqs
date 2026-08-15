/**
 * Table-driven state definitions.
 *
 * Creating and writing a state both derive from the same row, so the two can
 * never drift apart — the classic failure mode when the "create" list and the
 * "write" list are maintained separately.
 */

import type { ApiHourlyItem, ApiSpaceItem, ApiSummaryItem, FieldDef } from './types';
import { cloudsPercent, dayLength, formatDate, getDayName, iconUrl, isoTime, lookupTable, MOON_PHASE, MOON_ZODIAC } from './helpers';

/**
 * DAY_FIELDS.
 */
export const DAY_FIELDS: FieldDef[] = [
    { id: 'date', name: 'Date', nameDe: 'Datum', type: 'string', role: 'text', get: (d: ApiSummaryItem) => formatDate(d.date) },
    { id: 'date_iso', name: 'Date (ISO)', nameDe: 'Datum (ISO)', type: 'string', role: 'date', get: (d: ApiSummaryItem) => d.date ?? '' },
    { id: 'day_name', name: 'Weekday', nameDe: 'Wochentag', type: 'string', role: 'text', get: (d: ApiSummaryItem, c) => getDayName(d.date, c.lang) },
    { id: 'temp_max', name: 'Max. temperature', nameDe: 'Max. Temperatur', type: 'number', role: 'value.temperature.max', unit: '°C', digits: 1, get: (d: ApiSummaryItem) => d.temperature?.max },
    { id: 'temp_min', name: 'Min. temperature', nameDe: 'Min. Temperatur', type: 'number', role: 'value.temperature.min', unit: '°C', digits: 1, get: (d: ApiSummaryItem) => d.temperature?.min },
    { id: 'temp_avg', name: 'Average temperature', nameDe: 'Durchschnittstemperatur', type: 'number', role: 'value.temperature', unit: '°C', digits: 1, get: (d: ApiSummaryItem) => d.temperature?.avg },
    { id: 'weather_state', name: 'Weather code', nameDe: 'Wetter-Code', type: 'number', role: 'value', digits: 0, get: (d: ApiSummaryItem) => d.weather?.state },
    { id: 'weather_text', name: 'Weather', nameDe: 'Wetter', type: 'string', role: 'weather.state', get: (d: ApiSummaryItem) => d.weather?.text },
    { id: 'weather_icon', name: 'Icon URL', nameDe: 'Icon-URL', type: 'string', role: 'weather.icon', get: (d: ApiSummaryItem, c) => iconUrl(d.weather, c.iconBase, false) },
    { id: 'prec_probability', name: 'Precipitation probability', nameDe: 'Regenrisiko', type: 'number', role: 'value.precipitation.probability', unit: '%', digits: 0, get: (d: ApiSummaryItem) => d.prec?.probability },
    { id: 'prec_sum', name: 'Precipitation amount', nameDe: 'Niederschlagsmenge', type: 'number', role: 'value.precipitation', unit: 'mm', digits: 2, get: (d: ApiSummaryItem) => d.prec?.sum },
    { id: 'prec_class', name: 'Precipitation class (0-3)', nameDe: 'Niederschlagsklasse (0-3)', type: 'number', role: 'value', digits: 0, get: (d: ApiSummaryItem) => d.prec?.class },
    { id: 'rainy_hours', name: 'Rainy hours', nameDe: 'Regenstunden', type: 'number', role: 'value', unit: 'h', digits: 1, get: (d: ApiSummaryItem) => d.rainyHours },
    { id: 'sun_hours', name: 'Sunshine hours', nameDe: 'Sonnenstunden', type: 'number', role: 'value.sun', unit: 'h', digits: 1, get: (d: ApiSummaryItem) => d.sunHours },
    { id: 'clouds', name: 'Cloud cover', nameDe: 'Bewölkung', type: 'number', role: 'value.clouds', unit: '%', digits: 1, get: (d: ApiSummaryItem) => cloudsPercent(d.clouds) },
    { id: 'humidity', name: 'Relative humidity', nameDe: 'Relative Feuchte', type: 'number', role: 'value.humidity', unit: '%', digits: 0, get: (d: ApiSummaryItem) => d.relativeHumidity },
    { id: 'wind_speed', name: 'Wind speed (avg)', nameDe: 'Windgeschwindigkeit (Ø)', type: 'number', role: 'value.speed.wind', unit: 'km/h', digits: 1, get: (d: ApiSummaryItem) => d.wind?.avg },
    { id: 'wind_speed_max', name: 'Max. wind speed', nameDe: 'Max. Windgeschwindigkeit', type: 'number', role: 'value.speed.wind.max', unit: 'km/h', digits: 1, get: (d: ApiSummaryItem) => d.wind?.max ?? d.wind?.avg },
    { id: 'wind_gusts', name: 'Wind gusts', nameDe: 'Windböen', type: 'number', role: 'value.speed.wind.gust', unit: 'km/h', digits: 1, get: (d: ApiSummaryItem) => d.wind?.gusts },
    { id: 'wind_direction', name: 'Wind direction', nameDe: 'Windrichtung', type: 'string', role: 'weather.direction', get: (d: ApiSummaryItem) => d.wind?.direction },
    { id: 'wind_direction_short', name: 'Wind direction (short)', nameDe: 'Windrichtung (kurz)', type: 'string', role: 'weather.direction', get: (d: ApiSummaryItem) => d.wind?.text },
    { id: 'wind_degree', name: 'Wind direction (degrees)', nameDe: 'Windrichtung (Grad)', type: 'number', role: 'value.direction.wind', unit: '°', digits: 0, get: (d: ApiSummaryItem) => d.wind?.degree },
    { id: 'wind_significant', name: 'Significant wind', nameDe: 'Signifikanter Wind', type: 'boolean', role: 'indicator', get: (d: ApiSummaryItem) => !!d.wind?.significantWind },

    { id: 'pressure', name: 'Air pressure', nameDe: 'Luftdruck', type: 'number', role: 'value.pressure', unit: 'hPa', digits: 0, group: 'extended', get: (d: ApiSummaryItem) => d.pressure },
    { id: 'windchill_min', name: 'Feels like min.', nameDe: 'Gefühlt min.', type: 'number', role: 'value.temperature.min', unit: '°C', digits: 1, group: 'extended', get: (d: ApiSummaryItem) => d.windchill?.min },
    { id: 'windchill_max', name: 'Feels like max.', nameDe: 'Gefühlt max.', type: 'number', role: 'value.temperature.max', unit: '°C', digits: 1, group: 'extended', get: (d: ApiSummaryItem) => d.windchill?.max },

    { id: 'snow_sum', name: 'Snow (water equivalent)', nameDe: 'Schnee (Wasseräquivalent)', type: 'number', role: 'value.precipitation', unit: 'mm', digits: 2, group: 'snow', get: (d: ApiSummaryItem) => d.prec?.snow },
    { id: 'fresh_snow_min', name: 'Fresh snow min.', nameDe: 'Neuschnee min.', type: 'number', role: 'value', unit: 'cm', digits: 1, group: 'snow', get: (d: ApiSummaryItem) => d.prec?.freshSnowRangeMin },
    { id: 'fresh_snow_max', name: 'Fresh snow max.', nameDe: 'Neuschnee max.', type: 'number', role: 'value', unit: 'cm', digits: 1, group: 'snow', get: (d: ApiSummaryItem) => d.prec?.freshSnowRangeMax },
    { id: 'snowline_min', name: 'Snow line min.', nameDe: 'Schneefallgrenze min.', type: 'number', role: 'value', unit: 'm', digits: 0, group: 'snow', get: (d: ApiSummaryItem) => d.snowLine?.min },
    { id: 'snowline_max', name: 'Snow line max.', nameDe: 'Schneefallgrenze max.', type: 'number', role: 'value', unit: 'm', digits: 0, group: 'snow', get: (d: ApiSummaryItem) => d.snowLine?.max },

    { id: 'warn_active', name: 'Warning active', nameDe: 'Warnung aktiv', type: 'boolean', role: 'indicator.alarm', group: 'warn', get: (d: ApiSummaryItem) => !!d.highestWarning },
    { id: 'warn_group', name: 'Warning group', nameDe: 'Warnung Gruppe', type: 'string', role: 'text', group: 'warn', get: (d: ApiSummaryItem) => d.highestWarning?.group },
    { id: 'warn_text', name: 'Warning text', nameDe: 'Warnung Text', type: 'string', role: 'text', group: 'warn', get: (d: ApiSummaryItem) => d.highestWarning?.text },
    { id: 'warn_severity', name: 'Warning severity', nameDe: 'Warnung Schweregrad', type: 'string', role: 'text', group: 'warn', get: (d: ApiSummaryItem) => d.highestWarning?.severity },
    { id: 'warn_severity_int', name: 'Warning severity (0-4)', nameDe: 'Warnung Schweregrad (0-4)', type: 'number', role: 'value.severity', digits: 0, group: 'warn', get: (d: ApiSummaryItem) => d.highestWarning?.severityInt },
];

/**
 * ASTRO_FIELDS.
 */
export const ASTRO_FIELDS: FieldDef[] = [
    { id: 'sunrise', name: 'Sunrise', nameDe: 'Sonnenaufgang', type: 'string', role: 'date.sunrise', get: (a) => isoTime(a.sunrise) },
    { id: 'sunset', name: 'Sunset', nameDe: 'Sonnenuntergang', type: 'string', role: 'date.sunset', get: (a) => isoTime(a.sunset) },
    { id: 'dawn', name: 'Dawn', nameDe: 'Morgendämmerung', type: 'string', role: 'text', get: (a) => isoTime(a.dawn) },
    { id: 'dusk', name: 'Dusk', nameDe: 'Abenddämmerung', type: 'string', role: 'text', get: (a) => isoTime(a.dusk) },
    { id: 'suntransit', name: 'Solar noon', nameDe: 'Sonnenhöchststand', type: 'string', role: 'text', get: (a) => isoTime(a.suntransit) },
    { id: 'sunrise_iso', name: 'Sunrise (ISO)', nameDe: 'Sonnenaufgang (ISO)', type: 'string', role: 'date.sunrise', get: (a) => a.sunrise ?? '' },
    { id: 'sunset_iso', name: 'Sunset (ISO)', nameDe: 'Sonnenuntergang (ISO)', type: 'string', role: 'date.sunset', get: (a) => a.sunset ?? '' },
    { id: 'day_length', name: 'Day length', nameDe: 'Tageslänge', type: 'number', role: 'value', unit: 'h', digits: 2, get: (a) => dayLength(a.sunrise, a.sunset) },
    { id: 'moonrise', name: 'Moonrise', nameDe: 'Mondaufgang', type: 'string', role: 'text', get: (a) => isoTime(a.moonrise) },
    { id: 'moonset', name: 'Moonset', nameDe: 'Monduntergang', type: 'string', role: 'text', get: (a) => isoTime(a.moonset) },
    { id: 'moonphase', name: 'Moon phase (1-8)', nameDe: 'Mondphase (1-8)', type: 'number', role: 'value', digits: 0, get: (a) => a.moonphase },
    { id: 'moonphase_text', name: 'Moon phase', nameDe: 'Mondphase', type: 'string', role: 'text', get: (a, c) => lookupTable(MOON_PHASE, c.lang, a.moonphase) },
    { id: 'moonzodiac', name: 'Moon zodiac (1-12)', nameDe: 'Mond-Tierkreiszeichen (1-12)', type: 'number', role: 'value', digits: 0, get: (a) => a.moonzodiac },
    { id: 'moonzodiac_text', name: 'Moon zodiac', nameDe: 'Mond-Tierkreiszeichen', type: 'string', role: 'text', get: (a, c) => lookupTable(MOON_ZODIAC, c.lang, a.moonzodiac) },
];

/**
 * SPACE_FIELDS.
 */
export const SPACE_FIELDS: FieldDef[] = [
    { id: 'temp', name: 'Temperature', nameDe: 'Temperatur', type: 'number', role: 'value.temperature', unit: '°C', digits: 1, get: (s: ApiSpaceItem) => s.temperature?.avg },
    { id: 'temp_min', name: 'Temperature min.', nameDe: 'Temperatur min.', type: 'number', role: 'value.temperature.min', unit: '°C', digits: 1, get: (s: ApiSpaceItem) => s.temperature?.min },
    { id: 'temp_max', name: 'Temperature max.', nameDe: 'Temperatur max.', type: 'number', role: 'value.temperature.max', unit: '°C', digits: 1, get: (s: ApiSpaceItem) => s.temperature?.max },
    { id: 'weather_state', name: 'Weather code', nameDe: 'Wetter-Code', type: 'number', role: 'value', digits: 0, get: (s: ApiSpaceItem) => s.weather?.state },
    { id: 'weather_text', name: 'Weather', nameDe: 'Wetter', type: 'string', role: 'weather.state', get: (s: ApiSpaceItem) => s.weather?.text },
    { id: 'weather_icon', name: 'Icon URL', nameDe: 'Icon-URL', type: 'string', role: 'weather.icon', get: (s: ApiSpaceItem, c) => iconUrl(s.weather, c.iconBase, !!s.isNight) },
    { id: 'is_night', name: 'Night', nameDe: 'Nacht', type: 'boolean', role: 'indicator', get: (s: ApiSpaceItem) => !!s.isNight },
    { id: 'prec_prob', name: 'Precipitation probability', nameDe: 'Regenrisiko', type: 'number', role: 'value.precipitation.probability', unit: '%', digits: 0, get: (s: ApiSpaceItem) => s.prec?.probability },
    { id: 'prec_sum', name: 'Precipitation amount', nameDe: 'Niederschlagsmenge', type: 'number', role: 'value.precipitation', unit: 'mm', digits: 2, get: (s: ApiSpaceItem) => s.prec?.sum },
    { id: 'wind_speed', name: 'Wind speed', nameDe: 'Windgeschwindigkeit', type: 'number', role: 'value.speed.wind', unit: 'km/h', digits: 1, get: (s: ApiSpaceItem) => s.wind?.avg },
    { id: 'wind_gusts', name: 'Wind gusts', nameDe: 'Windböen', type: 'number', role: 'value.speed.wind.gust', unit: 'km/h', digits: 1, get: (s: ApiSpaceItem) => s.wind?.gusts },
    { id: 'wind_direction_short', name: 'Wind direction (short)', nameDe: 'Windrichtung (kurz)', type: 'string', role: 'weather.direction', get: (s: ApiSpaceItem) => s.wind?.text },
    { id: 'wind_degree', name: 'Wind direction (degrees)', nameDe: 'Windrichtung (Grad)', type: 'number', role: 'value.direction.wind', unit: '°', digits: 0, get: (s: ApiSpaceItem) => s.wind?.degree },
    { id: 'wind_significant', name: 'Significant wind', nameDe: 'Signifikanter Wind', type: 'boolean', role: 'indicator', get: (s: ApiSpaceItem) => !!s.wind?.significantWind },
    { id: 'clouds', name: 'Cloud cover', nameDe: 'Bewölkung', type: 'number', role: 'value.clouds', unit: '%', digits: 1, get: (s: ApiSpaceItem) => cloudsPercent(s.clouds) },
    { id: 'humidity', name: 'Relative humidity', nameDe: 'Relative Feuchte', type: 'number', role: 'value.humidity', unit: '%', digits: 0, get: (s: ApiSpaceItem) => s.relativeHumidity },
    { id: 'sun_hours', name: 'Sunshine hours', nameDe: 'Sonnenstunden', type: 'number', role: 'value.sun', unit: 'h', digits: 1, get: (s: ApiSpaceItem) => s.sunHours },

    { id: 'pressure', name: 'Air pressure', nameDe: 'Luftdruck', type: 'number', role: 'value.pressure', unit: 'hPa', digits: 0, group: 'extended', get: (s: ApiSpaceItem) => s.pressure },
    { id: 'windchill_min', name: 'Feels like min.', nameDe: 'Gefühlt min.', type: 'number', role: 'value.temperature.min', unit: '°C', digits: 1, group: 'extended', get: (s: ApiSpaceItem) => s.windchill?.min },
    { id: 'windchill_max', name: 'Feels like max.', nameDe: 'Gefühlt max.', type: 'number', role: 'value.temperature.max', unit: '°C', digits: 1, group: 'extended', get: (s: ApiSpaceItem) => s.windchill?.max },

    { id: 'snowline_min', name: 'Snow line min.', nameDe: 'Schneefallgrenze min.', type: 'number', role: 'value', unit: 'm', digits: 0, group: 'snow', get: (s: ApiSpaceItem) => s.snowLine?.min },
    { id: 'snowline_max', name: 'Snow line max.', nameDe: 'Schneefallgrenze max.', type: 'number', role: 'value', unit: 'm', digits: 0, group: 'snow', get: (s: ApiSpaceItem) => s.snowLine?.max },
    { id: 'fresh_snow_max', name: 'Fresh snow max.', nameDe: 'Neuschnee max.', type: 'number', role: 'value', unit: 'cm', digits: 1, group: 'snow', get: (s: ApiSpaceItem) => s.prec?.freshSnowRangeMax },

    { id: 'warn_active', name: 'Warning active', nameDe: 'Warnung aktiv', type: 'boolean', role: 'indicator.alarm', group: 'warn', get: (s: ApiSpaceItem) => !!s.highestWarning },
    { id: 'warn_text', name: 'Warning text', nameDe: 'Warnung Text', type: 'string', role: 'text', group: 'warn', get: (s: ApiSpaceItem) => s.highestWarning?.text },
    { id: 'warn_severity_int', name: 'Warning severity (0-4)', nameDe: 'Warnung Schweregrad (0-4)', type: 'number', role: 'value.severity', digits: 0, group: 'warn', get: (s: ApiSpaceItem) => s.highestWarning?.severityInt },
];

/**
 * HOUR_FIELDS.
 */
export const HOUR_FIELDS: FieldDef[] = [
    { id: 'time', name: 'Time (local)', nameDe: 'Uhrzeit (Ortszeit)', type: 'string', role: 'text', get: (h: ApiHourlyItem) => h.__time },
    { id: 'from', name: 'Timestamp (UTC)', nameDe: 'Zeitstempel (UTC)', type: 'string', role: 'date', get: (h: ApiHourlyItem) => h.from ?? h.dateWithTimezone ?? '' },
    { id: 'valid', name: 'Value up to date', nameDe: 'Wert aktuell', type: 'boolean', role: 'indicator', get: () => true },
    { id: 'temp', name: 'Temperature', nameDe: 'Temperatur', type: 'number', role: 'value.temperature', unit: '°C', digits: 1, get: (h: ApiHourlyItem) => h.temperature },
    { id: 'windchill', name: 'Feels like', nameDe: 'Gefühlt', type: 'number', role: 'value.temperature', unit: '°C', digits: 1, get: (h: ApiHourlyItem) => h.windchill },
    { id: 'weather_state', name: 'Weather code', nameDe: 'Wetter-Code', type: 'number', role: 'value', digits: 0, get: (h: ApiHourlyItem) => h.weather?.state },
    { id: 'weather_text', name: 'Weather', nameDe: 'Wetter', type: 'string', role: 'weather.state', get: (h: ApiHourlyItem) => h.weather?.text },
    { id: 'weather_icon', name: 'Icon URL', nameDe: 'Icon-URL', type: 'string', role: 'weather.icon', get: (h: ApiHourlyItem, c) => iconUrl(h.weather, c.iconBase, !!h.isNight) },
    { id: 'is_night', name: 'Night', nameDe: 'Nacht', type: 'boolean', role: 'indicator', get: (h: ApiHourlyItem) => !!h.isNight },
    { id: 'prec_prob', name: 'Precipitation probability', nameDe: 'Regenwahrscheinlichkeit', type: 'number', role: 'value.precipitation.probability', unit: '%', digits: 0, get: (h: ApiHourlyItem) => h.prec?.probability },
    { id: 'prec_sum', name: 'Precipitation amount', nameDe: 'Niederschlagsmenge', type: 'number', role: 'value.precipitation', unit: 'mm', digits: 2, get: (h: ApiHourlyItem) => h.prec?.sum },
    { id: 'wind_speed', name: 'Wind speed', nameDe: 'Windgeschwindigkeit', type: 'number', role: 'value.speed.wind', unit: 'km/h', digits: 1, get: (h: ApiHourlyItem) => h.wind?.avg },
    { id: 'wind_gusts', name: 'Wind gusts', nameDe: 'Windböen', type: 'number', role: 'value.speed.wind.gust', unit: 'km/h', digits: 1, get: (h: ApiHourlyItem) => h.wind?.gusts },
    { id: 'wind_dir', name: 'Wind direction', nameDe: 'Windrichtung', type: 'string', role: 'weather.direction', get: (h: ApiHourlyItem) => h.wind?.direction },
    { id: 'wind_dir_short', name: 'Wind direction (short)', nameDe: 'Windrichtung (kurz)', type: 'string', role: 'weather.direction', get: (h: ApiHourlyItem) => h.wind?.text },
    { id: 'wind_degree', name: 'Wind direction (degrees)', nameDe: 'Windrichtung (Grad)', type: 'number', role: 'value.direction.wind', unit: '°', digits: 0, get: (h: ApiHourlyItem) => h.wind?.degree },
    { id: 'wind_significant', name: 'Significant wind', nameDe: 'Signifikanter Wind', type: 'boolean', role: 'indicator', get: (h: ApiHourlyItem) => !!h.wind?.significantWind },
    { id: 'humidity', name: 'Relative humidity', nameDe: 'Relative Feuchte', type: 'number', role: 'value.humidity', unit: '%', digits: 0, get: (h: ApiHourlyItem) => h.relativeHumidity },
    { id: 'clouds', name: 'Cloud cover', nameDe: 'Bewölkung', type: 'number', role: 'value.clouds', unit: '%', digits: 1, get: (h: ApiHourlyItem) => cloudsPercent(h.clouds) },
    { id: 'sun_hours', name: 'Sunshine hours', nameDe: 'Sonnenstunden', type: 'number', role: 'value.sun', unit: 'h', digits: 2, get: (h: ApiHourlyItem) => h.sunHours },

    { id: 'pressure', name: 'Air pressure', nameDe: 'Luftdruck', type: 'number', role: 'value.pressure', unit: 'hPa', digits: 0, group: 'extended', get: (h: ApiHourlyItem) => h.pressure },
    { id: 'dewpoint', name: 'Dew point', nameDe: 'Taupunkt', type: 'number', role: 'value.temperature.dewpoint', unit: '°C', digits: 1, group: 'extended', get: (h: ApiHourlyItem) => h.dewpoint },

    { id: 'fresh_snow', name: 'Fresh snow', nameDe: 'Neuschnee', type: 'number', role: 'value', unit: 'cm', digits: 1, group: 'snow', get: (h: ApiHourlyItem) => h.freshSnow },
    { id: 'snowline', name: 'Snow line', nameDe: 'Schneefallgrenze', type: 'number', role: 'value', unit: 'm', digits: 0, group: 'snow', get: (h: ApiHourlyItem) => h.prec?.snowLine },

    { id: 'warn_active', name: 'Warning active', nameDe: 'Warnung aktiv', type: 'boolean', role: 'indicator.alarm', group: 'warn', get: (h: ApiHourlyItem) => !!h.highestWarning },
    { id: 'warn_text', name: 'Warning text', nameDe: 'Warnung Text', type: 'string', role: 'text', group: 'warn', get: (h: ApiHourlyItem) => h.highestWarning?.text },
    { id: 'warn_severity_int', name: 'Warning severity (0-4)', nameDe: 'Warnung Schweregrad (0-4)', type: 'number', role: 'value.severity', digits: 0, group: 'warn', get: (h: ApiHourlyItem) => h.highestWarning?.severityInt },
];

/**
 * Extra fields in `current` that are copied from the day summary, not from the hour.
 */
export const CURRENT_EXTRA: { id: string; name: string; nameDe: string; type: ioBroker.CommonType; role: string; unit?: string; from: string; astro?: boolean }[] = [
    { id: 'date', name: 'Date', nameDe: 'Datum', type: 'string', role: 'text', from: 'date' },
    { id: 'day_name', name: 'Weekday', nameDe: 'Wochentag', type: 'string', role: 'text', from: 'day_name' },
    { id: 'temp_min_today', name: 'Min. temperature today', nameDe: 'Min. Temperatur heute', type: 'number', role: 'value.temperature.min', unit: '°C', from: 'temp_min' },
    { id: 'temp_max_today', name: 'Max. temperature today', nameDe: 'Max. Temperatur heute', type: 'number', role: 'value.temperature.max', unit: '°C', from: 'temp_max' },
    { id: 'sunrise', name: 'Sunrise', nameDe: 'Sonnenaufgang', type: 'string', role: 'date.sunrise', from: 'astro.sunrise', astro: true },
    { id: 'sunset', name: 'Sunset', nameDe: 'Sonnenuntergang', type: 'string', role: 'date.sunset', from: 'astro.sunset', astro: true },
];

/**
 * SPACE_SEGMENTS.
 */
export const SPACE_SEGMENTS = ['morning', 'afternoon', 'evening', 'night'] as const;

/**
 * SPACE_LABELS.
 */
export const SPACE_LABELS: Record<string, { en: string; de: string }> = {
    morning: { en: 'Morning', de: 'Morgen' },
    afternoon: { en: 'Afternoon', de: 'Mittag' },
    evening: { en: 'Evening', de: 'Abend' },
    night: { en: 'Night', de: 'Nacht' },
};

/**
 * State ids inside a day section that earlier versions created and that are
 * removed on startup. `icon` and `text` were renamed to `weather_icon` and
 * `weather_text` in 0.1.3 so the tree uses one naming scheme throughout.
 */
export const LEGACY_SPACE_FIELDS = ['icon', 'text'] as const;
