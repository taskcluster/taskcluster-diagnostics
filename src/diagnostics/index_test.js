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
    let taskId = [slugid.nice(),slugid.nice()];
    let ns = 'garbage.tc-diagnostics.' + slugid.nice();
    return helper.index.insertTask(ns, {
      taskId: taskId[0],
      rank: 0,
      data: { message: 'test-index'},
      expires
    }).catch(done)
    .then(result => {
      assert(result.taskId === taskId[0]);
    })
    .then(() => {
      //try and find task
      debug("Finding task",taskId[0]);
      return helper.index.findTask(ns).then(result => {
        assert(result.taskId === taskId[0], "Wrong taskId");
      }).catch(done);
    })
    .then(() => {
      return helper.index.insertTask(ns, {
        taskId: taskId[1],
        rank: 1,
        data: { message: 'test-index'},
        expires
      }).catch(done);
    }).then(() => {
      debug("Finding task",taskId[1]);
      return helper.index.findTask(ns).then(result => {
        assert(result.taskId === taskId[1], "Wrong taskId");
      }).catch(done);
    }).then(() => {
      done();
    })
  });

  it('should fail when trying to find non existing task', function (done) {
    let ns = slugid.nice() + '.' + slugid.nice();
    debug(ns);
    return helper.index.findTask(ns)
    .then(() => {
      done(new Error("This should not work"));
    })
    .catch(err => {
      assert(err.statusCode === 404, "Wrong status code");
      return done();
    });
  })

  it('should find top level namespaces', function(done) {
    this.timeout(30*1000);
    return helper.index.listNamespaces('',{}).then(result => {
      debug("Top-level namespaces: ");
      result.namespaces.map(ns => {
        debug(ns.namespace);
        assert(ns.namespace.indexOf('.') === -1, "Shouldn't have any dots");
      });
      done();
    });
  });

  it('should find top level tasks', function(done) {
    this.timeout(30*1000);
    return helper.index.listTasks('',{}).then(result => {
      debug("Top-level tasks: ");
      result.tasks.map(task => {
        debug(task.namespace);
        assert(task.namespace.indexOf('.') === -1, "Shouldn't have any dots");
      });
      done();
    });
  });
});
