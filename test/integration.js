'use strict';

const path = require('path');
const { tests } = require('@iobroker/testing');

// Starts a real js-controller in a temporary directory and boots the adapter.
// Without a valid API key the adapter must still start cleanly and must not crash.
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('starts without an API key', (getHarness) => {
            it('should start and stay alive', async function () {
                this.timeout(60000);
                const harness = getHarness();

                await harness.changeAdapterConfig('meteonomiqs', {
                    native: {
                        apiKey: '',
                        useSystemLocation: true,
                        forecastDays: 3,
                        enableHourly: false,
                        enableCurrent: false,
                    },
                });

                await harness.startAdapterAndWait();
                expect(harness.isAdapterRunning()).to.be.true;
            });
        });
    },
});
