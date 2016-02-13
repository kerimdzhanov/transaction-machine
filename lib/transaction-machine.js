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

const db = require('./db');

const initAccountBase = require('./account');

/**
 * The main application class.
 *
 * @param {object} [options]
 * @constructor
 */
function TransactionMachine(options) {
  this.options = options || (options = {});

  /**
   * Database querying functions.
   */
  this.db = db;

  /**
   * Account `type => implementation` map.
   *
   * @type {Object}
   * @private
   */
  this._accountTypeMap = {};
  this.Account = initAccountBase(this);

  //this._transactionTypeMap = {};
  //this.Transaction = initTransactionBase(this);
}

inherits(TransactionMachine, EventEmitter);

/**
 * Initialize a new `TransactionMachine` instance.
 *
 * @param {object} options
 * @return {TransactionMachine}
 */
TransactionMachine.init = function (options) {
  return new TransactionMachine(options);
};

/**
 * Account type implementations accessor.
 *
 * When called first time for a specific type, a new account type will be registered.
 * All subsequent calls for this type will return an existing implementation reference.
 *
 * @example
 *
 * const processing = require('transaction-machine')();
 *
 * // registering a new account type (first call)
 * processing.account('SystemBalancer')
 *   .pre('create', (next) => {
 *     console.log('creating a new system balancer:', this.toJSON());
 *     next();
 *   })
 *   .pre('create', (next) => {
 *     this.postpaid = true;
 *     next();
 *   });
 *
 * // accessing account type constructor (subsequent call)
 * const SystemBalancer = processing.account('SystemBalancer');
 *
 * // attaching more hooks to the same account type (subsequent call)
 * processing.account('SystemBalancer')
 *   .post('create', () => {
 *     console.log('system balancer created:', this.toJSON());
 *   });
 *
 * // creating a new system balancer
 * var balancer = new SystemBalancer({
 *   key: 'root',
 *   label: 'root balancer'
 * });
 *
 * balancer.save().then((balancer) => {
 *   console.log(balancer.id); // >> 6547
 * });
 *
 * // or simply
 * Account.create({
 *   type: 'SystemBalancer',
 *   key: 'root',
 *   label: 'root balancer'
 * })
 * .then((balancer) => {
 *   console.log(balancer.id); // >> 6547
 *   assert.ok(balancer instanceof SystemBalancer);
 *   assert.ok(balancer instanceof Account);
 * });
 *
 * // as of hooks, the code above will output:
 * // >> creating a new system balancer: {
 * // >>   type: 'SystemBalancer',
 * // >>   key: 'root',
 * // >>   label: 'root balancer'
 * // >> }
 * // >>
 * // >> system balancer created: {
 * // >>   type: 'SystemBalancer',
 * // >>   key: 'root',
 * // >>   label: 'root balancer',
 * // >>   postpaid: true,
 * // >>   id: 6547,
 * // >>   balance: 0.0,
 * // >>   created_at: Sun Jan 31 2016 19:43:36 GMT+0600 (KGT)
 * // >> }
 *
 * @param {string} type - account type name
 * @return {function} a new account type implementation constructor
 */
TransactionMachine.prototype.account = function (type) {
  return this._accountTypeMap[type] || this.Account.discriminator(type);
};

/**
 * Transaction type implementations accessor.
 *
 * @param {string} type - transaction type name
 * @param {object} [impl] - transaction implementation constructor, default: `Transaction`
 */
TransactionMachine.prototype.transaction = function (type, impl) {
};

/**
 * @exports TransactionMachine
 */
module.exports = TransactionMachine;
