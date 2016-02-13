'use strict';

exports.up = function (db, callback) {
  db.runSql(`
    CREATE TYPE account_status AS ENUM ('active', 'suspended', 'deleted');

    CREATE TABLE "account" (
      "id"            SERIAL            PRIMARY KEY,
      "key"           VARCHAR(36)       NOT NULL,
      "type"          VARCHAR(20)                       DEFAULT NULL,
      "balance"       NUMERIC(11,2)     NOT NULL        DEFAULT 0.00,
      "postpaid"      BOOLEAN           NOT NULL        DEFAULT FALSE,
      "status"        account_status    NOT NULL        DEFAULT 'active',
      "created_at"    TIMESTAMP         NOT NULL        DEFAULT NOW(),
      "updated_at"    TIMESTAMP                         DEFAULT NULL,
      CONSTRAINT "prepaid_account_balance" CHECK ("postpaid" = TRUE OR "balance" >= 0.00)
    );

    CREATE UNIQUE INDEX "account_key_idx" ON "account" ("key");

    CREATE INDEX "account_status_idx" ON "account" ("status");
  `, callback);
};

exports.down = function (db, callback) {
  db.runSql(`
    DROP TABLE IF EXISTS "account";
    DROP TYPE IF EXISTS account_status;
  `, callback);
};
