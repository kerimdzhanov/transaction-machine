'use strict';

/**
 * Transaction Machine instance.
 *
 * @type {exports|TransactionMachine}
 */
const processing = require('../lib/processing');

/**
 * Example external APIs stub.
 */
const api = require('../lib/external-api-stubs');

/**
 * System balancer account example.
 */
const Balancer = processing.account('Balancer');

/**
 * Balancer `pre-insert` hook (middleware).
 * With this hook, all newly created balancers will have `postpaid=true`.
 */
Balancer.pre('insert', function (next) {
  this.attributes.postpaid = true;
  next();
});

/**
 * Balancer `post-insert` hook (middleware).
 * Notify, for example admins, that new system balancer have been created.
 */
Balancer.post('insert', (next) => {
  api.notify(`a new system balancer is created: ${this}`);
  return next();
});

module.exports = Balancer;
