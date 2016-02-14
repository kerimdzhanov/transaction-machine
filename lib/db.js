/*!
 * The MIT License
 *
 * Copyright (c) 2016 Dan Kerimdzhanov <kerimdzhanov@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict';

const pg = require('pg');
const inherits = require('util').inherits;

const path = require('path');
const fs = require('fs');

let dir = process.cwd();
while (true) {
  if (fs.existsSync(dir + '/db/config.json')) {
    break;
  }

  dir = path.dirname(dir);
  if (dir === '/') {
    console.error('Error: unable to find `db/config.json` in `lib/db.js`');
    process.exit(1);
  }
}

const NODE_ENV = (process.env.NODE_ENV || 'dev');
const configs = require(dir + '/db/config.json')[NODE_ENV];

/* istanbul ignore if */
if (!configs) {
  throw new Error(`unrecognized environment "${NODE_ENV}"`);
}

/**
 * Get db config by name.
 *
 * @private
 * @param {string} name
 * @param {*} [defaultValue]
 * @return {*}
 */
function getConfig(name, defaultValue) {
  let config = configs[name];

  if (typeof config === 'object' && config.ENV) {
    config = process.env[config.ENV];
  }
  else if (typeof config === 'undefined') {
    config = defaultValue;
  }

  return config;
}

const CONNECTION = {
  user: getConfig('user'),
  password: getConfig('password'),
  host: getConfig('host', 'localhost'),
  port: parseInt(getConfig('port'), 10),
  database: getConfig('database')
};

const DEBUG = process.env.PG_DEBUG;
/* istanbul ignore next: db query debug mode */
if (DEBUG && DEBUG !== '0' && DEBUG.toLowerCase() !== 'false') {
  const pgQueryOrigin = pg.Client.prototype.query;
  pg.Client.prototype.query = function () {
    console.log('\n >> ', arguments[0]); // >>>
    if (typeof arguments[1] === 'object') {
      console.log(arguments[1]); // >>>
    }
    console.log(''); // >>>
    pgQueryOrigin.apply(this, arguments);
  };
}

exports.Client = (function Client() {
  pg.Client.call(this, CONNECTION);
});
inherits(exports.Client, pg.Client);

/**
 * Get the database connection from the connection pool.
 *
 * @param {function(err:Error, client:Connection, done:Function)} callback
 */
exports.connect = function (callback) {
  pg.connect(CONNECTION, callback);
};

/**
 * Database transaction session mechanism.
 *
 * Automatically begin the database transaction on start and commit/rollback on completed.
 *
 * @param {function(err:Error, client:Connection, done:Function)} callback
 */
exports.transaction = function (callback) {
  exports.connect((err, client, complete) => {
    if (err) {
      return callback(err);
    }

    client.query('BEGIN;', (err) => {
      if (err) {
        rollback(client, complete);
        return callback(err);
      }

      callback(null, client, (error, done) => {
        if (error) {
          return rollback(client, (err) => {
            complete(err);
            done(err);
          });
        }

        client.query('COMMIT;', (err) => {
          complete(err);
          done(err);
        });
      });
    });
  });
};

/**
 * Rollback a given transaction.
 *
 * @param {pg.Client} client
 * @param {function} complete
 * @private
 */
function rollback(client, complete) {
  client.query('ROLLBACK;', function (err) {
    // If there was a problem rolling back the query
    // something is seriously messed up.  Return the error
    // to the complete function to close & remove this client from
    // the pool.  If you leave a client in the pool with an unaborted
    // transaction weird, hard to diagnose problems might happen.
    return complete(err);
  });
}
