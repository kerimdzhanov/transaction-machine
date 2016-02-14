#!/usr/bin/env node

/*!
 * Example processing worker.
 */

'use strict';

const kue = require('kue'),
      queue = kue.createQueue();

const processing = require('../lib/transaction-machine').init();

const Failure = processing.Failure;
const Account = processing.Account;

/**
 * Register a job processor function.
 *
 * @param {string} type - job type
 * @param {function} fn - processing function
 */
function worker(type, fn) {
  queue.process(type, (job, done) => {
    process.stdout.write(`processing "${type}"...`); // >>>
    fn(job, function (err) {
      if (err) {
        console.log(' [failed]'); // >>>
        console.error(err.toString()); // >>>

        if (!(err instanceof Failure)) {
          let args = arguments;
          return job.attempts(0).save((e) => {
            if (e) {
              console.error(e, '`job.save()` failed!'); // >>>
            }

            done.apply(null, args);
          });
        }
      }
      else {
        console.log(' [completed]'); // >>>
      }

      done.apply(null, arguments);
    });
  });
}

worker('create_account', (job, done) => {
  Account.create(job.data)
    .then(account => done(null, account.toObject()))
    .catch(err => done(err));
});

console.log('transaction machine worker is started and listening for a queue jobs...'); // >>>
