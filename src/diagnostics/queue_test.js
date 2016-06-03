'use strict';

describe('Queue', function () {
  var assume      = require('assume');
  var helper      = require('../helper');
  var slugid      = require('slugid');
  var taskcluster = require('taskcluster-client');
  var debug       = require('debug')('queue:test');
    
  if(!helper.cfg.taskcluster.credentials.accessToken){
    debug("Skipping test due to missing credentials");
    return;
  }

  it("can create task",async function (done) {
    this.timeout(60*1000);
    let taskId = slugid.v4();
    let testDef = helper.simpleTaskDef(taskId);

    try{
      let queueResponse = await helper.queue.createTask(taskId,testDef);
      debug("Task defined with taskId %s", taskId);
      debug('Message payload: %s',JSON.stringify(queueResponse));
      assume(queueResponse.status.taskId).equals(taskId);
      /*
      We use queue.task() to check if the task exists
      */
      let response = await helper.queue.task(taskId);
      debug("task response: ",response);
      assume(response.created).equals(testDef.created);
      assume(response.schedulerId).equals(testDef.schedulerId);
      assume(response.metadata).eql(testDef.metadata);
      return done();
    }catch (err) {
      done(err);
    }
  });

  ['self-dependency','no self-dependency'].map( dep => {
    
    it('createTask is idempotent with ' + dep , async function (done) {
      this.timeout(60*1000);
      let taskId = slugid.nice();
      let testDef = helper.simpleTaskDef(taskId);

      if(dep == 'self-dependency'){
        testDef.dependencies = [taskId];
      }
      
      debug("Using taskId: ",taskId);
      try{
        
        let qr = await helper.queue.createTask(taskId, testDef);
        debug(qr);
        await helper.queue.scheduleTask(taskId);
        let qr1 = await helper.queue.createTask(taskId, testDef);
        debug(qr1);
        assume(qr).eql(qr1);
        done();
      }catch (err){
        done(err);
      }
      
    });
    
  });

});
