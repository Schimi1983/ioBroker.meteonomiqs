'use strict';

const path = require('path');
const { tests } = require('@iobroker/testing');

// Boots a real js-controller in a temporary directory, installs the adapter and
// starts it with its default configuration. Without an API key the adapter must
// still come up cleanly and stay alive instead of crashing — that is exactly
// what this standard suite verifies.
//
// Deliberately no custom assertions here: anything beyond the standard suite
// needs chai imported explicitly, and a broken test file fails the whole matrix
// for reasons that have nothing to do with the adapter.
tests.integration(path.join(__dirname, '..'));
