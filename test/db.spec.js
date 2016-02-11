'use strict';

const expect = require('chai').expect,
      sinon = require('sinon');

const helper = require('./helper');

const pg = require('pg');
const db = require('../lib/db');
const config = require('../db/config')[process.env.NODE_ENV];

describe('db', () => {
  describe('.Client', () => {
    it('represents pre-configured `pg.Client`', (done) => {
      let client = new db.Client();

      expect(client).to.be.an.instanceof(pg.Client);
      expect(client).to.have.property('database', config.database);

      client.connect((err) => {
        if (err) {
          return done(err);
        }

        client.end();
        done();
      });
    });
  });

  describe('.connect', () => {
    it('creates or gets connection from pool', (done) => {
      let first;

      db.connect((err, client, releaseFirst) => {
        if (err) { return done(err); }

        first = client;

        db.connect((err, client, releaseSecond) => {
          if (err) { return done(err); }

          expect(client).to.not.equal(first,
            'expected new connection to have been created');

          releaseFirst();

          db.connect((err, client, releaseThird) => {
            if (err) { return done(err); }

            expect(client).to.equal(first,
              'expected released connection to have been reused');

            releaseSecond();
            releaseThird();
            done();
          });
        });
      });
    });

    describe('if connection failures', () => {
      beforeEach('stub `pg.connect`', () => {
        sinon.stub(pg, 'connect')
          .yieldsAsync(new Error('database connection failed'));
      });

      afterEach('restore `pg.connect`', () => {
        pg.connect.restore();
      });

      it('calls back with an occurred error', function (done) {
        db.connect((err) => {
          expect(err).to.exist;

          expect(err).to.be.an.instanceof(Error)
            .with.property('message', 'database connection failed');

          done();
        });
      });
    });
  });

  describe('.transaction', () => {
    beforeEach('create tmp table', (done) => {
      let client = new db.Client();
      client.connect();
      client.query('CREATE TABLE IF NOT EXISTS "txn_test" ("id" SERIAL);', (err) => {
        client.end();
        done(err);
      });
    });

    afterEach('drop tmp table', (done) => {
      let client = new db.Client();
      client.connect();
      client.query('DROP TABLE IF EXISTS "txn_test";', (err) => {
        client.end();
        done(err);
      });
    });

    let insert = (txn, callback) => {
      txn.query('INSERT INTO "txn_test" ("id") VALUES (DEFAULT);', callback);
    };

    let select = (callback) => {
      let client = new db.Client();
      client.connect();
      client.query('SELECT * FROM "txn_test";', (err, result) => {
        client.end();
        callback(err, result);
      });
    };

    it('wraps all queries into a single transaction', (done) => {
      db.transaction((err, txn, complete) => {
        if (err) {
          return done(err);
        }

        insert(txn, (err) => {
          if (err) {
            complete(err);
            return done(err);
          }

          insert(txn, (err) => {
            if (err) {
              complete(err);
              return done(err);
            }

            select((err, result) => {
              if (err) {
                complete(err);
                return done(err);
              }

              expect(result).to.have.property('rows').that.is.empty;

              complete(null, (err) => { // commit the transaction
                if (err) {
                  return done(err);
                }

                select((err, result) => {
                  if (err) {
                    return done(err);
                  }

                  expect(result).to.have.property('rows').with.length(2);

                  done();
                });
              });
            });
          });
        });
      });
    });

    describe('if connection failures', () => {
      beforeEach('stub `pg.connect`', () => {
        sinon.stub(pg, 'connect')
          .yieldsAsync(new Error('database connection failed'));
      });

      afterEach('restore `pg.connect`', () => {
        pg.connect.restore();
      });

      it('calls back with an occurred error', function (done) {
        db.transaction((err) => {
          expect(err).to.exist;

          expect(err).to.be.an.instanceof(Error)
            .with.property('message', 'database connection failed');

          done();
        });
      });
    });

    describe('if `~complete` is called back with an error', () => {
      it('rolls back the transaction', (done) => {
        db.transaction((err, txn, complete) => {
          if (err) {
            return done(err);
          }

          insert(txn, (err) => {
            if (err) {
              complete(err);
              return done(err);
            }

            complete(new Error('Oops,.. rollback!'), (err) => {
              if (err) {
                return done(err);
              }

              select((err, result) => {
                if (err) {
                  return done(err);
                }

                expect(result).to.have.property('rows').that.is.empty;

                done();
              });
            });
          });
        });
      });
    });

  });
});
