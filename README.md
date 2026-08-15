![Logo](admin/meteonomiqs.png)

# ioBroker.meteonomiqs

[![NPM version](https://img.shields.io/npm/v/iobroker.meteonomiqs.svg)](https://www.npmjs.com/package/iobroker.meteonomiqs)
[![Downloads](https://img.shields.io/npm/dm/iobroker.meteonomiqs.svg)](https://www.npmjs.com/package/iobroker.meteonomiqs)
[![License](https://img.shields.io/github/license/Schimi1983/ioBroker.meteonomiqs)](LICENSE)

Weather forecast from **wetter.com** via the [Meteonomiqs Public Weather API v4.0](https://doc.meteonomiqs.com/doc/forecast_v4_0.html).

Up to 14 days of forecast, day sections, hourly values, the hour currently in progress, weather warnings, sun and moon data — all from a **single** API call per fetch. The adapter is built around the fact that the free plan only allows 100 calls per month.

---

## Features

| | |
|---|---|
| **Daily forecast** | 1–14 days: temperature, precipitation, wind, clouds, humidity, sunshine hours, pressure |
| **Day sections** | Morning, afternoon, evening and night per day |
| **Hourly values** | For one or more days, resolved in the time zone of the forecast location |
| **`current` folder** | The hour in progress, refreshed **every hour without an API call** |
| **Weather warnings** | Group, text and numeric severity (0–4) — no string comparison needed in scripts |
| **Sun and moon** | Sunrise, sunset, twilight, day length, moonrise, moon phase, zodiac |
| **Snow** | Snow line, fresh snow, snow water equivalent |
| **JSON aggregates** | `forecast_json` and `hourly_json` for VIS, jarvis and Material widgets |
| **Budget management** | Priority tiers that degrade gracefully instead of stalling |
| **Correct icons** | Uses the icon the API delivers, including night, storm and wind variants |

---

## Installation

Install the adapter through the ioBroker admin interface.

### API key

A key is required and available from [Meteonomiqs](https://www.meteonomiqs.com/de/wetter-api/). The free plan currently includes 100 calls per month, which is exactly what the default schedule is tuned for. The key is stored **encrypted** in the instance configuration.

---

## Configuration

### General

| Setting | Meaning |
|---|---|
| API key | Your Meteonomiqs key. Stored encrypted. |
| Use the ioBroker system location | Takes latitude/longitude from *Settings → System → Location*. Disable to enter coordinates manually. |
| Language of the weather texts | Applies to the descriptions delivered by the API. Empty = ioBroker system language. |
| Forecast days | 1–14. Lowering the value removes the day folders that are no longer needed. |

### Schedule

Fetch times are a table of `HH:MM` plus a **priority**. The default:

| Time | Priority | Purpose |
|---|---|---|
| 01:10 | 1 | Planning the day — the full forecast is in place before anyone gets up |
| 11:40 | 2 | Correction before the critical afternoon: thunderstorms, gusts, heat peak |
| 18:40 | 3 | Night and tomorrow: frost, storms, outlook for the next morning |

**Minimum hours between updates** is a cooldown that protects against restart loops. It must be *smaller* than the shortest gap between two fetch times — otherwise one fetch is skipped every single day. The adapter checks this on startup and writes an error to the log if the numbers do not work out.

### API budget

Three fetches a day come to 93 calls in a 31-day month — 7 short of the free plan's 100. Rather than hitting the wall at the end of the month, every fetch carries a priority tier:

> A tier-N fetch only runs while the remaining budget still carries **N calls per day** until the end of the month.

When it gets tight, the evening fetch drops out first, then midday. The night fetch survives longest and, in an emergency, falls back to every other day instead of stopping. Verified over a full simulated month:

| Starting point | Calls used | 01:10 | 11:40 | 18:40 |
|---|---|---|---|---|
| Clean month (31 days) | 93 / 100 | 31 | 31 | 31 |
| 20 calls already wasted | 98 / 100 | 31 | 31 | 16 |
| 40 calls already wasted | 99 / 100 | 31 | 28 | 0 |
| 70 calls already wasted | 100 / 100 | 30 | 0 | 0 |

The counter is a **local estimate** — the API does not report remaining quota. Only HTTP 429 is ground truth. `info.reset_counter` sets it back to zero if you ever need to.

### Data

Everything comes out of the same API response, so enabling more groups costs **no extra calls** — only more objects. Rough sizes at 7 forecast days:

| Configuration | Objects |
|---|---|
| Everything on, hourly for 2 days | ~2350 |
| Hourly for 1 day | ~1700 |
| Hourly off | ~1080 |
| Daily values only | ~370 |

On a Raspberry Pi, hourly values for one day is a sensible compromise.

---

## State tree

```
meteonomiqs.0
├── info
│   ├── connection            Connected to the API
│   ├── status                ok / no API key / HTTP 429 / …
│   ├── last_sync             Last successful fetch
│   ├── requests_month        Local estimate of calls used this month
│   ├── requests_left         Remaining calls
│   ├── force_update          Button: fetch now (skips the cooldown)
│   └── reset_counter         Button: reset the monthly counter
├── current                   The hour in progress, refreshed hourly
│   ├── temp, weather_text, weather_icon, is_night, …
│   ├── temp_min_today, temp_max_today, sunrise, sunset
│   ├── valid                 false when no data covers this hour
│   └── source                Which state the values were copied from
├── day_0 … day_N
│   ├── date, day_name, temp_min, temp_max, weather_icon, …
│   ├── warn_active, warn_severity_int
│   ├── astro                 sunrise, sunset, moon phase, day length …
│   ├── spaces                morning, afternoon, evening, night
│   └── hourly                00 … 23
├── forecast_json
└── hourly_json
```

### `current` — how it works

`current` mirrors the pattern of the `daswetter` and `open-meteo-weather` adapters, with two deliberate choices:

**Refreshed hourly, not only on fetch.** A `current` folder that only updates when the API is polled would be seven hours stale by evening. A separate hourly timer copies the values across at every full hour — which costs nothing, because the hourly data is already in the object tree.

**Read from the states, not from a cache.** Reading from the cached payload would leave `current` empty after every adapter restart until the next scheduled fetch. Reading from `day_N.hourly.HH.*` always works.

The day is resolved through `date_iso` rather than a fixed index. Between midnight and the first fetch of the day, "today" still lives in `day_1` — a hard-coded `day_0` would serve the wrong values in that window every single night.

`current` is the **forecast** for the current hour, not a measurement. Real-time values would need the `/nowcast` or `/stations` endpoints, which cost one call per query and do not fit into a 100-call plan.

---

## Development

```bash
npm install          # install dependencies
npm run build        # compile TypeScript to build/
npm run watch        # rebuild on change
npm run check        # type check without emitting
npm run lint         # ESLint
npm run test:ts      # unit tests
npm run test:package # validate package.json / io-package.json
npm run test:integration  # boots a real js-controller
npm run translate    # @iobroker/adapter-dev translation helper
```

Local test instance with [dev-server](https://github.com/ioBroker/dev-server):

```bash
npm install --global @iobroker/dev-server
dev-server setup
dev-server watch
```

---

Weather data © [wetter.com GmbH / Meteonomiqs](https://www.meteonomiqs.com). This adapter is not affiliated with wetter.com.

---

## Changelog

### 0.1.0

- Initial release
- Forecast for up to 14 days, day sections, hourly values
- `current` folder with the hour in progress, refreshed hourly without an API call
- Weather warnings, sun and moon data, pressure, dew point, wind chill, snow
- JSON aggregates for VIS and jarvis
- Budget management with priority tiers, cooldown and emergency reserve
- Admin UI (JSON Config) in 11 languages

---

## License

The MIT License (MIT)

Copyright (c) 2026 Schimi <szymon.haiduk@world-mg.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
