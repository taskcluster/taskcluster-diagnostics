'use strict';
describe('Index', function () {
  var taskcluster = require('taskcluster-client');
  var helper      = require('./helper.js');
  var slugid      = require('slugid');
  var assert      = require('assert');
  var debug       = require('debug')('index:test');

  it('should index and rank task', function (done) {
    this.timeout(30*1000);
    let expiry = taskcluster.fromNowJSON('1 hour');
  });

  it('should find top level namespaces', function(done) {
    this.timeout(30*1000);
    helper.index.listNamespaces('',{}).then(result => {
      debug("Top-level namespaces: ");
      result.namespaces.map(ns => {
        debug(ns.namespace);
        assert(ns.namespace.indexOf('.') === -1, "Shouldn't have any dots");
      });
      done();
    });
  });
});
