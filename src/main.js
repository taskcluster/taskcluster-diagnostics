'use strict';

let base      = require('taskcluster-base');
let TestSpawn = require('./TestSpawn');

let load = base.loader({
  cfg: {
    requires: ['profile'],
    setup: ({profile}) => base.config({profile}),
  },

  monitor: {
    requires: ['cfg','process','profile'],
    setup: ({process, profile, cfg}) => base.monitor({
      project:      'taskcluster-diagnostics',
      credentials:  cfg.taskcluster.credentials,
      mock:         profile === 'test', //for now
      process
    }),
  },

  diagnostics: {
    requires: ['process','monitor'],
    setup: async ({process, monitor}) => { 
      try{
        await TestSpawn.runTests(monitor);
        monitor.reportError('Diagnostics successful');
        monitor.stopResourceMonitoring();
      }catch(e){
        console.error(e);
      }
      debugger;
    },
  },

}, ['profile', 'process']);

load('diagnostics', {
  profile: process.env.NODE_ENV,
  process: process.argv[2]
});
