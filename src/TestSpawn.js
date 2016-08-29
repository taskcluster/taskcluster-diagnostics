'use strict';

var spawn         = require('child_process').spawn;
var StringDecoder = require('string_decoder').StringDecoder;
var path          = require('path');
var slugid        = require('slugid');
var Reporter      = require('./reporter/Reporter');
var debug         = require('debug')('spawn');
var base          = require('taskcluster-base');
/*
  This module generates a testId and spawns a TestRunner which runs tests and
  uploads raw logs.
  The uploading and running will be separated soon
*/

class TestSpawn {
  
  constructor (monitor) {
    this.monitor = monitor;
    //This is for monitoring
    this.log_reporter = null;
    this.json_reporter = null;
    this.decoder = new StringDecoder('utf8');

    this._spawnTests = this._spawnTests.bind(this);
    this._uploadLogs = this._uploadLogs.bind(this);
  }

  async _spawnTests () {
    
    let testId = slugid.nice();

    this.outbuff = '';
    this.json_result = {
      pass: [],
      fail: []
    };

    this.log_reporter = Reporter.createLogReporter(testId);
    this.json_reporter = Reporter.createJSONReporter(testId);
    debug("Running tests with id",testId);
    
    let startMessage = "Test started at " + (new Date()).toJSON() + "\n";
    this.outbuff += startMessage;
    debug(startMessage);

    let addToBuffer = data => {
      let str = this.decoder.write(data);
      this.outbuff += str;
      console.log(str);
      debug(str);
    }


    this.testProcess = spawn('node',['lib/tests.js'],{
      cwd: path.join(__dirname,'../'),
      stdio: ['ignore', 'pipe', 'pipe', 'ipc']
    });

    this.testProcess.stdout.on('data', addToBuffer);
    this.testProcess.stderr.on('data', addToBuffer);

    this.testProcess.on('message', (data) => {
      this.json_result = data.result;
      debug(data);
      console.log(data);
    });

    return new Promise ((resolve, reject) =>{
      return this.testProcess.on('close',async () => {
        var endMessage = "Tests ended at "+ (new Date()).toJSON() + "\n";
        this.outbuff += endMessage;
        return resolve(this.outbuff);
        
      }).on('error', async() => {
        return resolve(null);
      });      
    });

  }

  async _uploadLogs () {
    await this.log_reporter.upload(this.outbuff);
    await this.json_reporter.upload(this.json_result);
    this.monitor.measure('failed', this.json_result.fail.length);  
  }

  static async runTests (monitor) {
    let ts = new TestSpawn(monitor);
    return ts._spawnTests().then((result) =>{
      if(result){
        ts._uploadLogs();
      }else {
        monitor.reportError("Diagnostics failed", 'ERROR');
      }
    });
  }

}

module.exports = TestSpawn;
