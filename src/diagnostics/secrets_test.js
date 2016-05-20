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

  
});
