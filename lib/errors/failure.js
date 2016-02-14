'use strict';

const inherits = require('util').inherits;

function Failure(message, code) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  code && (this.code = code);
}

inherits(Failure, Error);

module.exports = Failure;
