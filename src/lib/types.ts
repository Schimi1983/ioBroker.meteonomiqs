/**
 * Type definitions for the Meteonomiqs Public Weather API v4.0
 * and for the adapter's internal structures.
 *
 * Only the fields actually consumed by this adapter are typed. The API is
 * documented at https://doc.meteonomiqs.com/doc/forecast_v4_0.html
 */

/** A numeric API value that may arrive as a plain number or wrapped in an object. */
export type ApiNumber =
  | number
  | null
  | undefined
  | {
      value?: number | null;
      avg?: number | null;
      sum?: number | null;
      max?: number | null;
      min?: number | null;
    };

export interface ApiWeather {
  /**
   *
   */
  state?: number | null;
  text?: string | null;
  /** Ready-made icon file name, e.g. "d_1.svg", "n_0.svg", "d_e_63.svg" (warning), "d_w_1.svg" (wind). */
  icon?: string | null;
}

export interface ApiWarning {
  /**
   *
   */
  group?: string | null;
  text?: string | null;
  /**
   *
   */
  severity?: string | null;
  /** 0 = unknown, 1 = minor, 2 = moderate, 3 = severe, 4 = extreme */
  severityInt?: number | null;
}

export interface ApiWind {
  /**
   *
   */
  unit?: string | null;
  /** Long form, e.g. "Nordostwind" */
  direction?: string | null;
  /** Short form, e.g. "NO" */
  text?: string | null;
  /**
   *
   */
  avg?: number | null;
  min?: number | null;
  /**
   *
   */
  max?: number | null;
  /**
   *
   */
  degree?: number | null;
  gusts?: {
    value?: number | null;
    text?: string | null;
  } | null;
  /**
   *
   */
  significantWind?: boolean | null;
}

export interface ApiPrec {
  sum?: number | null;
  /**
   *
   */
  probability?: number | null;
  /**
   *
   */
  class?: number | null;
  snow?: number | null;
  /**
   *
   */
  snowLine?: number | null;
  freshSnowRangeMin?: number | null;
  freshSnowRangeMax?: number | null;
}

export interface ApiAstronomy {
  /**
   *
   */
  dawn?: string | null;
  sunrise?: string | null;
  /**
   *
   */
  suntransit?: string | null;
  /**
   *
   */
  sunset?: string | null;
  /**
   *
   */
  dusk?: string | null;
  /**
   *
   */
  moonrise?: string | null;
  moontransit?: string | null;
  /**
   *
   */
  moonset?: string | null;
  /**
   *
   */
  moonphase?: number | null;
  moonzodiac?: number | null;
}

export interface ApiSummaryItem {
  /** Local date, YYYY-MM-DD */
  date?: string | null;
  /**
   *
   */
  from?: string | null;
  to?: string | null;
  /**
   *
   */
  period?: number | null;
  /**
   *
   */
  sunHours?: number | null;
  rainyHours?: number | null;
  /**
   *
   */
  pressure?: ApiNumber;
  relativeHumidity?: ApiNumber;
  /**
   *
   */
  clouds?: ApiNumber;
  /**
   *
   */
  weather?: ApiWeather | null;
  prec?: ApiPrec | null;
  /**
   *
   */
  temperature?: {
    min?: number | null;
    max?: number | null;
    avg?: number | null;
  } | null;
  wind?: ApiWind | null;
  windchill?: {
    min?: number | null;
    max?: number | null;
  } | null;
  highestWarning?: ApiWarning | null;
  /**
   *
   */
  astronomy?: ApiAstronomy | null;
  snowLine?: {
    min?: number | null;
    max?: number | null;
  } | null;
}

export interface ApiSpaceItem {
  date?: string | null;
  /**
   *
   */
  isNight?: boolean | null;
  sunHours?: number | null;
  /**
   *
   */
  pressure?: ApiNumber;
  /**
   *
   */
  relativeHumidity?: ApiNumber;
  clouds?: ApiNumber;
  /**
   *
   */
  weather?: ApiWeather | null;
  /**
   *
   */
  prec?: ApiPrec | null;
  /**
   *
   */
  temperature?: {
    min?: number | null;
    max?: number | null;
    avg?: number | null;
  } | null;
  wind?: ApiWind | null;
  /**
   *
   */
  windchill?: {
    min?: number | null;
    max?: number | null;
  } | null;
  /**
   *
   */
  highestWarning?: ApiWarning | null;
  snowLine?: {
    min?: number | null;
    max?: number | null;
  } | null;
}

export interface ApiSpacesDay {
  /**
   *
   */
  date?: string | null;
  morning?: ApiSpaceItem | null;
  /**
   *
   */
  afternoon?: ApiSpaceItem | null;
  /**
   *
   */
  evening?: ApiSpaceItem | null;
  night?: ApiSpaceItem | null;
}

export interface ApiHourlyItem {
  /**
   *
   */
  date?: string | null;
  dateWithTimezone?: string | null;
  /** Start of the hour in UTC (ISO 8601) */
  from?: string | null;
  /**
   *
   */
  to?: string | null;
  /**
   *
   */
  period?: number | null;
  freshSnow?: number | null;
  /**
   *
   */
  dewpoint?: number | null;
  /**
   *
   */
  weather?: ApiWeather | null;
  /**
   *
   */
  sunHours?: number | null;
  /**
   *
   */
  prec?: ApiPrec | null;
  temperature?: {
    avg?: number | null;
  } | null;
  /**
   *
   */
  relativeHumidity?: number | null;
  /**
   *
   */
  pressure?: number | null;
  /**
   *
   */
  clouds?: {
    low?: number | null;
    middle?: number | null;
    high?: number | null;
    eights?: number | null;
  } | null;
  /**
   *
   */
  wind?: ApiWind | null;
  windchill?: number | null;
  /**
   *
   */
  isNight?: boolean | null;
  /**
   *
   */
  highestWarning?: ApiWarning | null;

  /** Added by the adapter: local hour label ("07") */
  __hour?: string;
  /** Added by the adapter: local time label ("07:00") */
  __time?: string;
}

export interface ApiForecast {
  /**
   *
   */
  summary?: ApiSummaryItem[];
  spaces?: ApiSpacesDay[];
  /**
   *
   */
  hourly?: ApiHourlyItem[];
  forecastDate?: string | null;
  /**
   *
   */
  nextUpdate?: string | null;
  /**
   *
   */
  source?: string | null;
  /**
   *
   */
  location?: {
    timezone?: string | null;
    coordinates?: {
      latitude?: number | null;
      longitude?: number | null;
      elevation?: number | null;
    } | null;
  } | null;
  fingerprint?: string | null;
}

/** Context handed to the field getters. */
export interface RenderContext {
  /** Language code used for weekday and moon phase names. */
  lang: string;
  /** IANA time zone of the forecast location, e.g. "Europe/Berlin". */
  tz: string;
  /** Base URL for weather icons. */
  iconBase: string;
}

export type FieldGroup = "core" | "warn" | "astro" | "extended" | "snow";

export interface FieldDef {
  id: string;
  /** English state label. */
  name: string;
  /** German state label. Further languages can be added the same way. */
  nameDe: string;
  type: ioBroker.CommonType;
  /**
   *
   */
  role: string;
  /**
   *
   */
  unit?: string;
  /** Decimal places for numbers. Rounding removes float noise and avoids pointless writes. */
  digits?: number;
  group?: FieldGroup;
  /**
   *
   */
  get: (src: any, ctx: RenderContext) => unknown;
}

/** One configured update time. */
export interface UpdateTime {
  /** "HH:MM" */
  time: string;
  /**
   * Priority tier: this fetch only runs while the remaining budget still
   * supports `tier` calls per day until the end of the month.
   */
  tier: number;
}

export type FetchReason = "scheduled" | "startup" | "manual" | "config";
