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

var c = false, // --config
    m = false, // --migrations-dir
    t = false; // --migration-table

for (var i = 2, v; (v = process.argv[i]); i++) {
  if (v === '--config' || v === '-c') c = true;
  if (v === '--migrations-dir' || v === '-m') m = true;
  if (v === '--migrations-table' || v === '--table' || v === '-t') t = true;
}

if (!c) process.argv.push('--config', process.cwd() + '/db/config.json');
if (!m) process.argv.push('--migrations-dir', process.cwd() + '/db/migrations');
if (!t) process.argv.push('--migration-table', 'migration');

require('../node_modules/.bin/db-migrate');
