import config from '@iobroker/eslint-config';

export default [
    { ignores: ['build/**', 'admin/build/**', 'test/**', '*.config.mjs', '.releaserc.js'] },
    ...config,
];
