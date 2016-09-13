'use strict';

let base        = require('taskcluster-base');
let TestSpawn   = require('./TestSpawn');
let debug       = require('debug')('diagnostics:main');
let taskcluster = require('taskcluster-client');

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
    requires: ['cfg','monitor'],
    setup: async ({cfg, monitor}) => { 
      // Running tests
      let data = await TestSpawn.runTests();
      /*
       * Reporting via notify.
       */
      debug(data);
      let result = data.result;
      let keys = data.keys;
      //TODO: Add notify email
      try{
        let notify  = new taskcluster.Notify({
            credentials: cfg.taskcluster.credentials
        });
        let subject = 'Diagnostics results: ' + (new Date()).toJSON();
        let content = [`## Number of passing tests:  ${result.pass.length}`];
        result.pass.forEach(pass => content.push("* " + pass));
        content.push(`## Number of failing tests: ${result.fail.length}`);
        result.fail.forEach(fail => content.push("* " + fail));
        content = content.join("\n");
        let link = {
          text: "View raw logs",
          href: "https://taskcluster-diagnostic-logs.s3.amazonaws.com/" + keys.raw_key
        }
        cfg.emails.forEach(async address => {
          debug('sending email to ' + address);
          await notify.email({ address, subject, content, link });
        });
      }catch(e){
        console.log(e);
      }
      /* 
       * Reporting to sentry and statsum.
       */
      

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
      debug('reporting completed');
      //TODO: Add notify irc
      //TODO: Add notify pulse
    },
  },

}, ['profile']);

load('diagnostics', {
  profile:  process.env.NODE_ENV 
});
