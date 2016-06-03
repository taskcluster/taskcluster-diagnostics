'use strict';
describe('Auth', function () {
  var taskcluster = require('taskcluster-client');
  var hawk        = require('hawk');
  var helper      = require('../helper');
  var assume      = require('assume');
  var debug       = require('debug')('auth:test');
  var slugid      = require('slugid');
  var _           = require('lodash');

  if(!helper.cfg.taskcluster.credentials.accessToken){
    debug("Skipping test due to missing credentials");
    return;
  }

  var auth = new taskcluster.Auth({
    credentials:  helper.cfg.taskcluster.credentials
  });

  it('can get client', async function (done) {
    this.timeout(30*1000);
    let clientId = helper.cfg.taskcluster.credentials.clientId;
    try{
      let client = await auth.client(clientId);
      debug("Client: ",client);
      assume(client.clientId).equals(clientId);
      return done();
    } catch (err) {
      return done(err);
    }
  });

  it('can create and delete client', async function (done) {
    this.timeout(30*1000);
    let clientId = helper.cfg.taskcluster.credentials.clientId+'/'+slugid.nice();
    let expires = new Date();
    expires.setMinutes(expires.getMinutes() + 2);
    expires = expires.toJSON();
    debug("Creating client");
    try{
      let client = await auth.createClient(clientId,{
        expires,
        description: "delete me"
      });
      debug(client);
      assume(client.clientId).equals(clientId);
      await auth.deleteClient(clientId);
      return done();
    } catch (err) {
      return done(err);
    }
  });

  it('can answer authenticateHawk requests', async function (done) {
    let credentials = helper.cfg.taskcluster.credentials;

    this.timeout(30*1000);

    let data = {
      method:         'get',
      resource:       '/',
      host:           'test.taskcluster.net',
      port:           443
    };
    /*
    hawk.client.header('https://'+data.header+data.resource, data.method, req_credentials).field
    */
    data.authorization = hawk.client.header(
        'https://' + data.host + data.resource, data.method, {
          credentials: {
            id: credentials.clientId,
            key: credentials.accessToken,
            algorithm: 'sha256',
          },
          payload: '{}'
        }).field;
    try {
      let result = await auth.authenticateHawk(data);
      debug("Result: ",result);
      assume(result.status).equals('auth-success');
      assume(result.hash).equals('XtNvx1FqrUYVOLlne3l2WzcyRfj9QeC6YtmhMKKFMGY=');
      return done();
    } catch (err) {
      return done(err);
    }
  });

});
