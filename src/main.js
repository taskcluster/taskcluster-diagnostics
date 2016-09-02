'use strict';

let base      = require('taskcluster-base');
let TestSpawn = require('./TestSpawn');

let load = base.loader({
  cfg: {
    requires: ['profile'],
    setup: ({profile}) => base.config({profile}),
  },

  monitor: {
    requires: ['cfg','profile'],
    setup: ({process, profile, cfg}) => base.monitor({
      project:      'tc-diagnostics',
      credentials:  cfg.taskcluster.credentials,
      mock:         profile === 'test', //for now
      process
    }),
  },

  diagnostics: {
    requires: ['monitor'],
    setup: async ({monitor}) => { 
      let result = await TestSpawn.runTests(monitor);

      if(result){
        result.fail.forEach(async test => {
          await monitor.reportError('FAILED: ' + test);
        });
      }else{
        await monitor.reportError('diagnostics.failed');
      }

      await monitor.reportError('diagnostics.successful', 'info', {});
      monitor.measure('diagnostics.failed_test_count', result.fail.length);
      await monitor.flush();
    },
  },

}, ['profile']);

load('diagnostics', {
  profile:  process.env.NODE_ENV 
});
