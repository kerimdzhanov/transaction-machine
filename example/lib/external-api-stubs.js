'use strict';

/**
 * Example notification sender stub.
 */
exports.notify = function (message) {
  setTimeout(() => {
    console.log('Notification:', message); // >>>
  }, 100);
};
