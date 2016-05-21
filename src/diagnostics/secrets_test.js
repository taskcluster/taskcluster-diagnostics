'use strict';
describe("Secrets", function () {
  var taskcluster = require('taskcluster-client');
  var slugid      = require('slugid');
  var helper      = require('./helper');
  var assert      = require('assert');
  var debug       = require('debug')('secrets:test');

  let data = slugid.v4();
  let data2 = slugid.v4();
  let key1 = slugid.v4();
  let key2 = slugid.v4();

  let payloadExpires = {
    secret:   { data },
    expires:  taskcluster.fromNowJSON('2 hours')
  };
  let payloadExpires2 = {
    secret:   { data: data2 },
    expires:  taskcluster.fromNowJSON('2 hours')
  };
  let payloadExpired = {
    secret:   { data },
    expires:  taskcluster.fromNowJSON('- 2 hours')
  };
  
  it('should write a secret (allowed) and retreive it', function (done) {
    this.timeout(30*1000);
    return helper.secrets.set("garbage/"+key1, payloadExpires)
    .catch(err =>{
      debug(err);
      throw new Error("Error while writing secret");
    })
    .then(() => {
      return helper.secrets.get("garbage/"+key1);
    })
    .catch(err => {
      throw new Error("Error retrieving secret");
    })
    .then(secret => {
      debug(secret);
      assert(secret.secret.data === payloadExpires.secret.data, "Wrong object received");
      done();
    });
  });

  it('should reject writing a secret with disallowed scope', function (done) {
    this.timeout(30*1000);
    return helper.secrets.set("wrong-scope/"+key1, payloadExpires)
    .catch(err => {
      assert(err.statusCode === 403, "Wrong error code");
      done();
    })
    .then(() => {
      throw new Error("Secret should be disallowed");
      done();
    });
  });

  it('should update key', function (done) {
    this.timeout(60*1000);
    return helper.secrets.set("garbage/"+key1, payloadExpires)
    .then(() => {
      return helper.secrets.get("garbage/"+key1);
    }).then(secret => {
      debug(secret);
      assert(secret.secret.data === payloadExpires.secret.data);
      return helper.secrets.set("garbage/"+key1, payloadExpires2);
    })
    .catch(err => {
      debug(err);
      done();
    })
    .then(() => {
      debug("Retrieving new secret");
      return helper.secrets.get("garbage/"+key1);
    }).then(secret => {
      debug(secret);
      assert(secret.secret.data === payloadExpires2.secret.data);
      done();
    });
  });

  it('should delete secret', function (done) {
    this.timeout(60*1000);
    return helper.secrets.set("garbage/"+key1, payloadExpires)
    .then(() => {
      return helper.secrets.remove("garbage/"+key1);
    }).then(() => {
      return helper.secrets.get("garbage/"+key1);
    }).catch(err => {
      debug("Status code: ",err.statusCode);
      assert(err.statusCode === 404, "Wrong status code");
      done();
    }).then(() => {
      throw Error("Secret should be deleted");
    });
  });

  it('should fail when reading an expired secret', function (done) {
    this.timeout(30*1000);
    return helper.secrets.set("garbage/"+key2, payloadExpired)
    .then(() => {
      return helper.secrets.get("garbage/"+key2);
    }).catch(err => {
      debug("Error statusCode", err.statusCode);
      assert(err.statusCode === 410);
      done();
    }).then(() => {
      throw new Error("Secret should not be retreivable");
    });
  })

});
