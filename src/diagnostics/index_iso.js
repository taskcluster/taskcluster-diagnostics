'use strict';
describe('Index', function () {
  var taskcluster = require('taskcluster-client');
  var helper      = require('./helper.js');
  var slugid      = require('slugid');
  var assert      = require('assert');
  var debug       = require('debug')('index:test');

  it('should index and rank task', function (done) {
    this.timeout(30*1000);
    let expires = taskcluster.fromNowJSON('1 hour');
    let myNamespace = slugid.nice();
    let taskId = [slugid.v4(), slugid.v4()];
    debug(taskId);
    return helper.index.insertTask(myNamespace + '.mytask', {
      taskId: taskId[0],
      rank:   41,
      data:   { hello: "world" },
      expires
    }).catch(err =>{
      debug(err);
      return assert(!err, "Error");
    })
    .then(() => {
      debug('finding task with id:',taskId[0]);
      return helper.index.findTask(myNamespace + '.mytask').then(result => {
        debug(result);
        return assert(result.taskId === taskId[0]);
      });
    })
    .then(() => {
      return helper.index.insertTask(myNamespace + '.mytask', {
        taskId: taskId[1],
        rank:   42,
        data:   { hello: "world" },
        expiry
      });
    })
    .then(() => {
      debug('finding task with id:',taskId[1]);
      return helper.index.findTask(myNamespace + '.mytask').then(result => {
        debug(result);
        assert(result.taskId === taskId[1]);
      });
    })
  });

  it('should find top level namespaces', function() {
    this.timeout(30*1000);
    return helper.index.listNamespaces('',{}).then(result => {
      debug("Top-level namespaces: ");
      result.namespaces.map(ns => {
        debug(ns.namespace);
        assert(ns.namespace.indexOf('.') === -1, "Shouldn't have any dots");
      });
    });
  });
});
