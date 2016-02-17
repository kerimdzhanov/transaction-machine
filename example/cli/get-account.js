#!/usr/bin/env node

/*!
 * Example `get-account` command.
 */

'use strict';

const program = require('commander');

program
  .option('-k, --key <key>', 'get account by key')
  .option('--id <id>', 'get account by id')
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

const kue = require('kue'),
      queue = kue.createQueue();

let job = queue.create('get_account', query);

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
