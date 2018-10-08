const replace = require('replace');

replace({
  regex: '#!/usr/bin/env node',
  replacement: '',
  paths: ['node_modules/geocluster/index.js'],
});
