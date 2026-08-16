# Older changes

### 0.1.5 (2026-08-15)

- Values that match their default are no longer left with quality `0x20` ("substitute initial value"). A state created from `common.def` starts out substituted, and `setStateChanged` skipped the first write whenever the real value happened to be `0` or `false` — so states like `prec_sum`, `warn_active` or `sun_hours` stayed flagged as not-measured and showed up orange in the admin
- `info.connection` is no longer reported as false after a restart whose startup fetch was skipped by the cooldown — a skipped fetch is not a failure, and the stored forecast stays usable for 26 hours
- Fixed the German state labels in `current.*` — they carried the English prefix ("Now: Temperatur" instead of "Jetzt: Temperatur")
- Object metadata (label, role, unit) is now updated on existing states instead of only on first creation, so corrections reach installed instances
- **Breaking:** renamed `day_N.spaces.*.icon` to `weather_icon` and `.text` to `weather_text` for one naming scheme across the whole tree; the old states are removed automatically
- Added `wind_significant` for day, day section and hour — the flag behind the `_w_` icon variant, which is not covered by the warning states
- Raised the mocha timeout; the first `Intl` call is slow enough on cold Windows runners to trip the 2 s default
- Decoupled `tsconfig.json` from `@tsconfig/node22`; all compiler options are now declared explicitly
- Raised TypeScript to 5.9.3
- Restored `mocha` and `chai` in the devDependencies so `npm test` resolves the mocha binary
- CI: `testing-action-check@v2`, type check enabled, and the 25 unit tests are no longer skipped

### 0.1.1

- Renamed the adapter to `meteonomiqs` (npm blocks names similar to the existing `iobroker.wettercom`)
- Resolved all ESLint errors: `no-base-to-string`, empty JSDoc blocks, unused type import
- Restricted Dependabot to patch and minor updates

### 0.1.0

- Initial release
- Forecast for up to 14 days, day sections, hourly values
- `current` folder with the hour in progress, refreshed hourly without an API call
- Weather warnings, sun and moon data, pressure, dew point, wind chill, snow
- JSON aggregates for VIS and jarvis
- Budget management with priority tiers, cooldown and emergency reserve
- Admin UI (JSON Config) in 11 languages
