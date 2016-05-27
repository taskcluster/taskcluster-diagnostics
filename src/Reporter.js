'use strict';
var AWS     = require('aws-sdk');
var debug   = require('debug')('diagnostics:reporter');
var helper  = require('./diagnostics/helper');
var _       = require('lodash');

const MAX_NUMBER = 999999999999999;

/* This class uploads logs to s3*/
class Reporter {
  constructor (testId) {
    //init s3
    AWS.config.update({
      credentials:  helper.cfg.aws.credentials,
      region:       helper.cfg.aws.region
    });

    this.testId = testId;
    this.s3 = new AWS.S3({ params: { Bucket: helper.cfg.aws.bucket } });
    this.makeResultString = this.makeResultString.bind(this);
    this.upload = this.upload.bind(this);
  }

  setTestId (testId) {
    this.testId = testId;
  }

  makeResultString () {
    //override this
  }

  upload (result) {
    let Key = this.makeResultString(result);
    debug("Uploading object:", Key);
    return new Promise((resolve, reject) => {
      return this.s3.putObject({ Key , Body: JSON.stringify(result)}, (err, data) => {
        if(err){
          console.error(err);
          return reject(err);
        }
        return resolve(data);
      });
    });
  }
}

/* Upload JSON logs */

class JSONReporter extends Reporter {
  constructor (testId) {
    super(testId);
    this.makeResultString = this.makeResultString.bind(this);
  }

  makeResultString (result) {
    let rev_date = MAX_NUMBER - Math.round(Date.now()/1000);
    let stamp = (new Date()).toJSON();
    return ['taskcluster-diagnostic-logs',
      rev_date,
      stamp,
      this.testId + '.json'].join('/');
  }
}

/* Upload raw logs */

class LogReporter extends Reporter {
  constructor (testId) {
    super(testId);
    this.makeResultString = this.makeResultString.bind(this);
  }

  makeResultString (result) {
    let rev_date = MAX_NUMBER - Math.round(Date.now()/1000);
    let stamp = (new Date()).toJSON();
    return ['taskcluster-diagnostic-logs',
      rev_date,
      stamp,
      this.testId + '.log' ].join('/');
  }
}

module.exports = {
  JSONReporter,
  LogReporter
}
