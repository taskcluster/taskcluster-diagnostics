'use strict';

var spawn         = require('child_process').spawn;
var StringDecoder = require('string_decoder').StringDecoder;
var path          = require('path');
var slugid        = require('slugid');
var Reporter   		= require('./reporter/Reporter');
var debug         = require('debug')('spawn');
/*
  This module generates a testId and spawns a TestRunner which runs tests and
  uploads raw logs.
  The uploading and running will be separated soon
*/

class TestSpawn {
  
  constructor () {
    this.reporter = null;
    this.decoder = new StringDecoder('utf8');

    this._spawnTests = this._spawnTests.bind(this);
    this._uploadLogs = this._uploadLogs.bind(this);
  }

  async _spawnTests () {
    
    let testId = slugid.nice();

    this.outbuff = '';
    
    this.reporter = Reporter.createLogReporter(testId);
    debug("Running tests with id",testId);
    
    let startMessage = "Test started at " + (new Date()).toJSON() + "\n";
    this.outbuff += startMessage;
    debug(startMessage);

    let addToBuffer = data => {
      let str = this.decoder.write(data);
      this.outbuff += str;
      debug(str);
    }

    this.testProcess = spawn('node',['lib/tests.js','--id',testId],{
      cwd: path.join(__dirname,'../'),
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.testProcess.stdout.on('data', addToBuffer);
    this.testProcess.stderr.on('data', addToBuffer);

    return new Promise ((resolve, reject) =>{
      return this.testProcess.on('close',async () => {

        var endMessage = "Tests ended at "+ (new Date()).toJSON() + "\n";
        this.outbuff += endMessage;
        return resolve(this.outbuff);
        
      });      
    });

  }

  async _uploadLogs (outbuff) {
    var result = await this.reporter.upload(outbuff);
    console.log(result);
  }

  static runTests (upload) {
    let ts = new TestSpawn();
    ts._spawnTests().then(result => {
	ts._uploadLogs(result);   
    }).catch(console.log);
  }

}

TestSpawn.runTests ();
