'use strict';

const path = require('path');
const { tests } = require('@iobroker/testing');

// Validates package.json and io-package.json against the ioBroker requirements.
tests.packageFiles(path.join(__dirname, '..'));
