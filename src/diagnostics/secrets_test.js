'use strict';
describe("Secrets", function () {
  var taskcluster = require('taskcluster-client');
  var slugid      = require('slugid');
  var helper      = require('../helper');
  var assume      = require('assume');
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

  it('should write a secret (allowed) and retreive it', async function (done) {
    this.timeout(30*1000);
    try{
      await helper.secrets.set("garbage/"+key1, payloadExpires);
      let secret = await helper.secrets.get("garbage/"+key1);
      debug(secret);
      assume(secret.secret.data).equals(payloadExpires.secret.data);
      return done();
    } catch(err) {
      return done(err);
    }
  });

  it('should reject writing a secret with disallowed scope', async function (done) {
    this.timeout(2*60*1000);
    try{
      await helper.secrets.set("wrong-scope/"+key1, payloadExpires);
      return done((new Error("Secret should be disallowed")));
    } catch (err) {
      assume(err.statusCode).equals(403);
      done();
    }

  });

  it('should update key', async function (done) {
    this.timeout(2*60*1000);
    try{
      await helper.secrets.set("garbage/"+key1, payloadExpires)

      let secret = await helper.secrets.get("garbage/"+key1);
      debug(secret);
      assume(secret.secret.data).equals(payloadExpires.secret.data);

      await helper.secrets.set("garbage/"+key1, payloadExpires2);

      debug("Retrieving new secret");
      secret = await helper.secrets.get("garbage/"+key1);
      debug(secret);
      assume(secret.secret.data).equals(payloadExpires2.secret.data);

      return done();

    } catch (err) {
      return done(err);
    }
  });

  it('should delete secret', async function (done) {
    this.timeout(2*60*1000);
    await helper.secrets.set("garbage/"+key1, payloadExpires)
    await helper.secrets.remove("garbage/"+key1);
    try{
      await helper.secrets.get("garbage/"+key1);
      return done((new Error("Secret should not be found")));
    } catch (err) {
      debug("Status code: ",err.statusCode);
      assume(err.statusCode).equals(404);

      return done();
    }
  });

  it('should fail when reading an expired secret', async function (done) {
    this.timeout(2*60*1000);
    await helper.secrets.set("garbage/"+key2, payloadExpired);
    try{
      await helper.secrets.get("garbage/"+key2);
      return done((new Error("Secret should not be retreivable")));
    }catch (err) {
      debug("Error statusCode", err.statusCode);
      assume(err.statusCode).equals(410);
      return done();
    }
  })

});
