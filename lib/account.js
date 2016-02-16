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

const EventEmitter = require('events'),
      inherits = require('util').inherits;

const hooks = require('hooks-fixed');

const db = require('./db');

module.exports = function (app) {
  /**
   * Account base class implementation.
   *
   * @param {object} attributes - account attributes to assign
   * @constructor
   */
  function Account(attributes) {
    EventEmitter.apply(this);

    attributes || (attributes = {});

    /** @protected */
    this.attributes = attributes;

    var self = this;

    Object.defineProperty(this, 'id', {
      get: () => self.attributes.id,
      enumerable: true
    });

    Object.defineProperty(this, 'key', {
      get: () => self.attributes.key,
      enumerable: true
    });

    Object.defineProperty(this, 'type', {
      get: () => self.attributes.type,
      enumerable: true
    });

    Object.defineProperty(this, 'balance', {
      get: () => self.attributes.balance,
      enumerable: true
    });

    Object.defineProperty(this, 'postpaid', {
      get: () => self.attributes.postpaid,
      enumerable: true
    });

    Object.defineProperty(this, 'status', {
      get: () => self.attributes.status,
      enumerable: true
    });

    Object.defineProperty(this, 'created_at', {
      get: () => self.attributes.created_at,
      enumerable: true
    });

    Object.defineProperty(this, 'updated_at', {
      get: () => self.attributes.updated_at,
      enumerable: true
    });
  }

  inherits(Account, EventEmitter);

  Object.assign(Account, hooks);

  /**
   * Account schema.
   *
   * @type {{
   *   table: string,
   *   fields: {
   *     key: string,
   *     type: string,
   *     balance: string,
   *     postpaid: string,
   *     status: string
   *   }
   * }}
   */
  Account.schema = {
    table: 'account',
    fields: {
      key: 'varchar(36)',
      type: 'varchar(20)',
      balance: 'numeric(11,2)',
      postpaid: 'boolean',
      status: 'account_status'
    }
  };

  /**
   * Account inheritance mechanism.
   *
   * @param {string} type - account discriminator type
   * @param {function} [impl] - account constructor to inherit from, default: `Account`
   * @return {function} - a new account type constructor
   * @throws {Error} if account type is already defined
   */
  Account.discriminator = function (type, impl) {
    impl || (impl = Account);

    if (app._accountTypeMap[type]) {
      throw new Error(`account discriminator "${type}" is already defined`);
    }

    var newTypeImpl = function () {
      impl.apply(this, arguments);
      this.attributes.type = type;
    };

    inherits(newTypeImpl, impl);

    Object.assign(newTypeImpl, hooks);

    return (app._accountTypeMap[type] = newTypeImpl);
  };

  /**
   * Account factory.
   *
   * @param {object} params
   * @param {boolean} [params.postpaid]
   * @param {string} [params.label]
   * @return {Promise} that's resolved with a newly created account
   */
  Account.create = function createAccount(params) {
    return new Promise((resolve, reject) => {
      const impl = params.type ? app._accountTypeMap[params.type] : Account;

      if (!impl) {
        return reject(new Error(`unrecognized account type "${params.type}"`));
      }

      let account = new impl(params);
      account.insert((err) => err ? reject(err) : resolve(account));
    });
  };

  /**
   * Insert the account entry into the database.
   *
   * @param {function(err:Error)} callback
   */
  Account.prototype.insert = function insertAccount(callback) {
    let self = this;

    self.attributes.key || (self.attributes.key = null);

    db.connect((err, client, done) => {
      if (err) {
        return callback(err);
      }

      let schema = Account.schema,
          fields = [],
          values = [];

      for (let field in schema.fields) {
        if (schema.fields.hasOwnProperty(field) &&
          typeof self.attributes[field] !== 'undefined') {
          fields.push(field);
          values.push(self.attributes[field]);
        }
      }

      client.query(
        `INSERT INTO "${schema.table}" ("${fields.join('", "')}")
          VALUES (${values.map((_, i) => '$' + (i + 1)).join(', ')})
          RETURNING *;`, values,
        (err, result) => {
          if (err) {
            done(err); // close the broken connection
            return callback(err);
          }

          // reassign all attributes
          self.attributes = result.rows[0];

          done(); // release db connection
          callback();
        });
    });
  };

  /**
   * Converts the transaction into a plain javascript object.
   *
   * @return {object} js object
   */
  Account.prototype.toObject = function accountToObject() {
    let attrs = this.attributes,
        object = {};

    for (let key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        object[key] = this[key] || attrs[key];
      }
    }

    return object;
  };

  return Account;
};
