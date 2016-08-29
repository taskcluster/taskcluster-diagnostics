'use strict';

let base      = require('taskcluster-base');
let TestSpawn = require('./TestSpawn');

let load = base.loader({
  cfg: {
    requires: ['profile'],
    setup: ({profile}) => base.config({profile})
  },

  monitor: {
    requires: ['cfg','process','profile'],
    setup: ({process, profile, cfg}) => base.monitor({
      project:      'taskcluster-diagnostics',
      credentials:  cfg.taskcluster.credentials,
      mock:         true, //for now
      process
    })
  },

  diagnostics: {
    requires: ['monitor'],
    setup: async ({monitor}) =>{
      return TestSpawn.runTests(monitor);
    }
  }
}, ['profile', 'process']);

load('diagnostics', {
  profile: 'default',
  process: process.argv[2]
});
