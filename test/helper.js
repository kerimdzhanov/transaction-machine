'use strict';

process.env.NODE_ENV || (process.env.NODE_ENV = 'test');

const chai = require('chai');
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

const db = require('../lib/db');
exports.db = db;

db.clean = function dbClean() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('db.clean() is allowed only in "test" environment!');
  }

  return new Promise((resolve, reject) => {
    let client = new db.Client();
    client.connect();

    client.query('TRUNCATE "account" CASCADE', (err) => {
      if (err) {
        return reject(err);
      }

      resolve();
    });
  });
};

db.getAccountEntry = function getAccountEntry(query) {
  return new Promise((resolve, reject) => {
    let client = new db.Client();
    client.connect();

    let args = [];

    if (typeof query === 'undefined') {
      args[0] = 'SELECT * FROM "account"';
    }
    else {
      args[0] = 'SELECT * FROM "account" WHERE ';
      args[1] = []; // values

      let conditions = [];
      for (let field in query) {
        if (query.hasOwnProperty(field)) {
          args[1].push(query[field]);
          conditions.push(`"${field}" = \$${args[1].length}`);
        }
      }

      args[0] += conditions.join(', ');
    }

    args.push((err, result) => {
      client.end(); // close db connection

      if (err) {
        return reject(err);
      }

      if (!result.rowCount) {
        return reject(new Error('expected database entry to exist'));
      }

      resolve(result.rows[0]);
    });

    client.query.apply(client, args);
  });
};
