'use strict';
describe('Index', function () {
  var taskcluster = require('taskcluster-client');
  var helper      = require('../helper.js');
  var slugid      = require('slugid');
  var assume      = require('assume');
  var debug       = require('debug')('index:test');

  it('should index and rank task', async function (done) {
    this.timeout(2*60*1000);
    let expires = taskcluster.fromNowJSON('1 hour');
    let taskId = [slugid.nice(),slugid.nice()];
    let ns = 'garbage.tc-diagnostics.' + slugid.nice();

    try{
      let result = await helper.index.insertTask(ns, {
        taskId: taskId[0],
        rank: 0,
        data: { message: 'test-index'},
        expires
      });
      assume(result.taskId).equals(taskId[0]);

      debug("Finding task",taskId[0]);
      result = await helper.index.findTask(ns);

      assume(result.taskId).equals(taskId[0]);

      await helper.index.insertTask(ns, {
        taskId: taskId[1],
        rank: 1,
        data: { message: 'test-index'},
        expires
      });

      debug("Finding task",taskId[1]);

      result = await helper.index.findTask(ns);
      assume(result.taskId).equals(taskId[1]);
      return done();

    }catch (err) {
      return done(err);
    }
  });

  it('should fail when trying to find non existing task', async function (done) {
    this.timeout(2*60*1000);
    let ns = slugid.nice() + '.' + slugid.nice();
    debug(ns);
    try{
      await helper.index.findTask(ns);
      return done((new Error("This should not work")));
    } catch (err) {
      return done();
    }

  })

  it('should find top level namespaces', async function(done) {
    this.timeout(2*60*1000);
    let result = await helper.index.listNamespaces('',{});
    debug("Top-level namespaces: ");
    result.namespaces.map(ns => {
      debug(ns.namespace);
      assume(ns.namespace.indexOf('.')).equals(-1);
    });
    return done();
  });

  it('should find top level tasks', async function(done) {
    this.timeout(2*60*1000);
    let result = await helper.index.listTasks('',{});
    debug("Top-level tasks: ");
    result.tasks.map(task => {
      debug(task.namespace);
      assume(task.namespace.indexOf('.')).equals(-1);
    });
    return done();
  });
});
