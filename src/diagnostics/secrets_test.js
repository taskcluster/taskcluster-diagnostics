describe("Secrets", function () {
  var taskcluster = require('taskcluster-client');
  var slugid      = require('slugid');
  var helper      = require('./helper');

  let data = slugid.v4();
  let key1 = slugid.v4();
  let key2 = slugid.v4();

  let payloadExpires = {
    secret:   { data },
    expires:  taskcluster.fromNowJSON('2 hours')
  };
  let payloadExpired = {
    secret:   { data },
    expires:  taskcluster.fromNowJSON('- 2 hours')
  };
  let secrets = taskcluster.Secrets({
    credentials: helper.cfg.taskcluster.credentials;
  });

  let testCases = [
    {
      testName: "write secret with allowed key",
      method:   "set",
      name:     "garbage:"+key1,
      payload:  payloadExpires
    },
    {
      testName: "write secret with disallowed key",
      method:   "set",
      name:     "not-garbage:"+key2,
      payload:  payloadExpires
    }
  ]
});
