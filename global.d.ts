/**
 * Typed instance configuration.
 * Keep this in sync with the `native` block of io-package.json and with
 * admin/jsonConfig.json — the three together define the settings surface.
 */
declare global {
    namespace ioBroker {
        interface AdapterConfig {
            /** Meteonomiqs API key. Stored encrypted (see encryptedNative). */
            apiKey: string;
            /** Take latitude/longitude from the ioBroker system settings. */
            useSystemLocation: boolean;
            latitude: number;
            longitude: number;
            /** Empty = use the ioBroker system language. */
            language: string;

            /** Number of forecast days to create (1–14). */
            forecastDays: number;
            /** Monthly API call allowance of the booked plan. */
            monthlyLimit: number;
            /** Calls kept free for manual actions; retries never touch them. */
            reserveCalls: number;
            /** Cooldown that protects against restart loops. */
            minHoursBetweenUpdates: number;
            /** HTTP timeout in seconds. */
            httpTimeout: number;
            /** Additional attempts on network errors / HTTP 5xx. */
            maxRetries: number;

            /**
             * Fetch times with priority tier. A tier-N fetch only runs while the
             * remaining budget still carries N calls per day until month end.
             */
            updateTimes: { time: string; tier: number }[];

            enableSpaces: boolean;
            enableHourly: boolean;
            hourlyDays: number;
            enableCurrent: boolean;
            enableWarnings: boolean;
            enableAstro: boolean;
            enableExtended: boolean;
            enableSnow: boolean;
            enableJson: boolean;
        }
    }
}

export {};
