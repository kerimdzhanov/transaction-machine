'use strict';

const inherits = require('util').inherits;

function ValidationError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  message || (this.message = message);

  this.fields = new Map();
}

inherits(ValidationError, Error);

module.exports = ValidationError;
