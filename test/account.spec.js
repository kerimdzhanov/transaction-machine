'use strict';

const expect = require('chai').expect,
      sinon = require('sinon');

const helper = require('./helper');

const TransactionMachine = require('../lib/transaction-machine');

describe('Account', () => {
  let app, Account;

  beforeEach(helper.db.clean);

  beforeEach('init app', () => {
    app = TransactionMachine.init();
    Account = app.Account;
  });

  describe('constructor', () => {
    it('assigns given attributes', () => {
      let attributes = {
        id: 6547,
        key: 'account-constructor-1',
        type: 'account',
        balance: '14.95',
        postpaid: true,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };

      let account = new Account(attributes);

      for (let field in attributes) {
        if (attributes.hasOwnProperty(field)) {
          expect(account).to.have.property(field, attributes[field]);
        }
      }
    });
  });

  describe('.discriminator', () => {
    it('generates a new `Account` subclass', () => {
      const Wallet = Account.discriminator('Wallet'),
            Balancer = Account.discriminator('Balancer');

      var wallet = new Wallet(),
          balancer = new Balancer();

      expect(wallet)
        .to.be.an.instanceof(Account).and
        .to.be.an.instanceof(Wallet).and
        .not.to.be.an.instanceof(Balancer);

      expect(balancer)
        .to.be.an.instanceof(Account).and
        .to.be.an.instanceof(Balancer).and
        .not.to.be.an.instanceof(Wallet);
    });

    it('throws on duplicate type declarations', () => {
      Account.discriminator('DuplicatingType');

      expect(() => Account.discriminator('DuplicatingType'))
        .to.throw('account discriminator "DuplicatingType" is already defined');
    });
  });

  describe('.create', () => {
    let params;

    beforeEach('setup default params', () => {
      params = {};
    });

    beforeEach('stub Account#insert', () => {
      sinon.stub(Account.prototype, 'insert').yieldsAsync();
    });

    afterEach('restore Account#insert', () => {
      Account.prototype.insert.restore();
    });

    it('inserts the account into the database', () => {
      return Account.create(params)
        .then((account) => {
          expect(Account.prototype.insert)
            .to.have.been.calledOn(account);
        });
    });

    it('resolves an instance of `Account`', () => {
      return Account.create(params)
        .then((account) => {
          expect(account).to.be.an.instanceof(Account);
        });
    });

    describe('when `type` attribute is given', () => {
      let CustomType;

      beforeEach('define custom type', () => {
        CustomType = Account.discriminator('CustomType');
      });

      it('resolves an instance of a given `type`', () => {
        params.type = 'CustomType';

        return Account.create(params)
          .then((account) => {
            expect(account).to.be.an.instanceof(CustomType)
              .and.have.property('type', 'CustomType');
          });
      });
    });
  });

  describe('#insert', () => {
    let attributes, account;

    beforeEach('setup account instance', () => {
      attributes = { key: 'account#insert-1' };
      account = new Account(attributes);
    });

    it('adds a new record into the database', (done) => {
      account.insert((err) => {
        if (err) {
          return done(err);
        }

        expect(helper.db.getAccountEntry())
          .to.eventually.have.property('key', 'account#insert-1')
          .notify(done);
      });
    });

    it('failures if `account.key` is missing', (done) => {
      delete account.attributes.key;

      account.insert((err) => {
        expect(err).to.exist;

        expect(err).to.have.property('code', '23502');
        expect(err).to.have.property('table', 'account');
        expect(err).to.have.property('column', 'key');

        expect(err).to.have.property('message')
          .that.is.match(/not-null constraint/);

        done();
      });
    });

    it('failures on duplicate `account.key` entry', (done) => {
      account.insert((err) => {
        if (err) {
          return done(err);
        }

        account.insert((err) => {
          expect(err).to.exist;

          expect(err).to.have.property('code', '23505');
          expect(err).to.have.property('constraint', 'account_key_idx');

          expect(err).to.have.property('message')
            .that.is.match(/duplicate key value/);

          done();
        });
      });
    });

    it('assigns a new account `id`', (done) => {
      account.insert((err) => {
        if (err) {
          return done(err);
        }

        expect(account).to.have.property('id').that.is.a('number');

        let nextAccount = new Account({ key: 'account#insert-2' });

        nextAccount.insert((err) => {
          if (err) {
            return done(err);
          }

          expect(nextAccount.id).not.to.eql(account.id);

          done();
        });
      });
    });

    it('records current datetime as `created_at`', (done) => {
      account.insert((err) => {
        if (err) {
          return done(err);
        }

        helper.db.getAccountEntry({ id: account.id })
          .then((entry) => {
            expect(entry).to.have.property('created_at').that.is.a('Date');

            expect(entry.created_at.getTime())
              .to.be.closeTo((new Date() - 100), 100);

            done();
          })
          .catch(err => done(err));
      });
    });

    it('assigns `created_at`', (done) => {
      account.insert((err) => {
        if (err) {
          return done(err);
        }

        expect(account).to.have.property('created_at').that.is.a('Date');

        done();
      });
    });
  });

  describe('#toObject', () => {
    let account;

    beforeEach('setup account instance', () => {
      account = new Account({
        id: 54326,
        key: 'account#toObject-1',
        type: 'e-wallet',
        balance: '-0.01',
        postpaid: true,
        status: 'active',
        custom: 'value'
      });
    });

    it('returns a plain javascript object', () => {
      expect(account.toObject())
        .to.eql({
          id: 54326,
          key: 'account#toObject-1',
          type: 'e-wallet',
          balance: '-0.01',
          postpaid: true,
          status: 'active',
          custom: 'value'
        });
    });
  });
});
