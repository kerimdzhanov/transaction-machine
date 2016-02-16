#!/usr/bin/env node

/*!
 * Example `create-account` command.
 */

'use strict';

const program = require('commander');

program
  .usage('[options] <key>')
  .option('-t, --type <type>', 'specify account type')
  .option('-s, --status <status>', 'specify account status')
  .option('-P, --postpaid', 'create postpaid account')
  .parse(process.argv);

let key = program.args[0];
if (!key) {
  program.help();
}

const kue = require('kue'),
      queue = kue.createQueue();

let params = { key: key };
program.type && (params.type = program.type);
program.postpaid && (params.postpaid = program.postpaid);

let job = queue.create('create_account', params);

job.on('complete', account => {
  console.log('account created:\n', account); // >>>
  process.nextTick(() => process.exit(0));
});

job.on('failed', err => {
  console.error('Error:', err); // >>>
  process.nextTick(() => process.exit(err.code || -2));
});

job.save(err => {
  if (err) {
    console.error('Error:', err); // >>>
    process.nextTick(() => process.exit(-1));
  }
});
