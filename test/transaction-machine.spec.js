'use strict';

const expect = require('chai').expect;

const TransactionMachine = require('../lib/transaction-machine');

describe('TransactionMachine', () => {
  let app, Account;

  beforeEach('init app', () => {
    app = TransactionMachine.init();
    Account = app.Account;
  });

  describe('#account', () => {
    it('defines a new account type', () => {
      const Wallet = app.account('Wallet'),
            Balancer = app.account('Balancer');

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

    describe('when account type is already defined', () => {
      let CustomType;

      beforeEach('predefine account type', () => {
        CustomType = app.account('CustomType');
      });

      it('returns a reference to the existing implementation', () => {
        expect(app.account('CustomType')).to.eql(CustomType);
      });
    });
  });
});
