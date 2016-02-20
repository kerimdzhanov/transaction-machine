#!/usr/bin/env node

/*!
 * Example `update-account` command.
 */

'use strict';

const program = require('commander');

program
  .option('-k, --key <key>', 'get account by key')
  .option('--id <id>', 'get account by id')
  .option('--set-key <key>', 'update account key')
  .option('--set-type <type>', `update account type`)
  .option('--set-status <status>', 'update account status, the value can be one of `active|suspended|deleted`')
  .option('--set-postpaid <bool>', "update account's `postpaid` attribute")
  .parse(process.argv);

var query = {};

if (program.key) {
  query.key = program.key;
}
else if (program.id) {
  query.id = parseInt(program.id);

  if (isNaN(query.id)) {
    console.error('Error: --id value is not a number'); // >>>
    process.exit(-3);
  }
}

if (!query.key && !query.id) {
  program.help();
}

var $set = {};

if (program.setKey) {
  $set.key = program.setKey;
}

if (program.setType) {
  $set.type = (program.setType === 'null') ? null : program.setType;
}

if (program.setStatus) {
  $set.status = program.setStatus;
}

if (program.setPostpaid) {
  let value;
  switch (program.setPostpaid) {
    case 'true':
    case 'yes':
    case '1':
      $set.postpaid = true;
      break;

    case 'false':
    case 'no':
    case '0':
      $set.postpaid = false;
      break;

    default:
      console.error('Error: --set-postpaid value is not a boolean'); // >>>
      process.exit(-4);
  }
}

const kue = require('kue'),
      queue = kue.createQueue();

let job = queue.create('update_account', {
  query: query,
  $set: $set
});

job.on('complete', account => {
  console.log('result:\n', account); // >>>
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
