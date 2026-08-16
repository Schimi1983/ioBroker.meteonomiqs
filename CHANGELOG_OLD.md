# Older changes

### 0.1.7 (2026-08-16)

- Removed `chai`, `@types/chai` and `@types/mocha` from the devDependencies — they come with `@iobroker/testing` and resolve fine without being declared. `mocha` has to stay declared because npm only links the binaries of direct dependencies, but its version now matches the range `@iobroker/testing` asks for, so a single copy is installed instead of the two that `^10` alongside `^11` used to produce (partly resolves `[E0063]`)

### 0.1.6 (2026-08-16)

- The fetch times now carry a per-installation offset of up to 15 minutes, derived from the ioBroker installation UUID. Every installation used to call the API in the very same minute; the offset is deterministic, so it survives restarts, and it is applied to all times equally, which leaves the gaps between them — and the cooldown check — untouched

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
