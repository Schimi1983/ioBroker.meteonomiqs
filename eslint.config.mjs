import config from '@iobroker/eslint-config';

export default [
    { ignores: ['build/**', 'admin/build/**', 'test/**', '*.config.mjs', '.releaserc.js'] },
    ...config,
    {
        // types.ts spiegelt eins zu eins die OpenAPI-Struktur von Meteonomiqs.
        // Jedes einzelne Feld zu kommentieren erzeugt rund 100 Warnungen ohne
        // Erkenntnisgewinn - die Feldnamen sind die der API, der Dateikopf
        // verweist auf die Spezifikation.
        files: ['src/lib/types.ts'],
        rules: {
            'jsdoc/require-jsdoc': 'off',
        },
    },
];
