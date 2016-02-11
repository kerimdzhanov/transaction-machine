#!/usr/bin/env node

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

const spawn = require('child_process').spawn;
const path = require('path');
const fs = require('fs');

/**
 * $ mkdir -p
 *
 * @param {string} path
 * @return {Promise}
 */
function mkdir_p(path) {
  return new Promise((resolve, reject) => {
    spawn('mkdir', ['-p', path])
      .on('close', (code) => {
        (code === 0) ? resolve() : reject(new Error(`mkdir_p exits with non-zero: ${code}`));
      });
  });
}

/**
 * List files.
 *
 * @param {string} path - path to directory
 * @param {RegExp} filter - filter regular expression
 * @return {Promise}
 */
function ls(path, filter) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, list) => {
      if (err) {
        return reject(err);
      }

      if (filter) {
        list = list.filter(file => filter.test(file));
      }

      resolve(list);
    });
  });
}

/**
 * Check whether a file exists.
 *
 * @param {string} filename
 * @return {Promise}
 */
function file_exists(filename) {
  return new Promise((resolve, reject) => {
    fs.exists(filename, resolve);
  });
}

/**
 * Streaming file copy.
 *
 * @param {string} source
 * @param {string} destination
 * @param {boolean} overwrite
 * @return {Promise}
 */
function cp(source, destination, overwrite) {
  overwrite || (overwrite = false);
  return new Promise((resolve, _reject) => {
    let rejected = false;
    function reject(err) {
      if (!rejected) {
        _reject(err);
        rejected = true;
      }
    }

    let rs = fs.createReadStream(source),
        ws = fs.createWriteStream(destination);

    rs.on('error', reject);
    ws.on('error', reject);

    ws.on('close', () => {
      if (!rejected) { resolve(); }
    });

    rs.pipe(ws);
  });
}

let source = path.dirname(__filename); // >> ./db
let destination = path.join(process.cwd(), 'db'); // >> $cwd/db

mkdir_p(path.join(destination, 'migrations'))
  .then(() => {
    return ls(path.join(source, 'migrations'), /\.js$/)
      .then(list => {
        let files = list.map(entry => path.join('migrations', entry));
        files.push('config.json');
        return files;
      });
  })
  .then(files => {
    return Promise.all(files.map(file => {
      let src = path.join(source, file);
      let dest = path.join(destination, file);
      return file_exists(dest)
        .then((exists) => {
          if (exists) {
            console.log(`file "db/${file}" exists, skipping...`); // >>>
            return Promise.resolve();
          }

          console.log(`generating "db/${file}"...`); // >>>
          return cp(src, dest);
        });
    }));
  })
  .then(() => {
    console.log('done.'); // >>>
  })
  .catch(err => {
    console.log('Error:', err); // >>>
  });
