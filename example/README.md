# Transaction Machine usage example

This is an example project that demonstrates use cases of the **Transaction Machine** module.


## Installing dependencies

To install dependencies specified in project's `package.json`, call:

    $ npm install


## Setting up the database

This project uses `transaction-machine` module directly, as well as it's `transaction-machine/db/config.json` and `db/migrations/*`.
So if you use this project files as a bootstrap for your own project, you'll need to run `generate-db-files.js` and `migrate.js` as specified in the [Setting up the database](https://github.com/kerimdzhanov/transaction-machine#setting-up-the-database) section of the Processing Machine's README.


## Running the processing application server

To start the example processing application server, run:

    $ [node] ./worker.js


## Creating accounts

Keeping the `worker.js` running, in a separate shell session, call:

    $ [node] ./cli/create-account.js acc-1

It will enqueue the account creation job which is processed by `worker.js`.
A new account with key `acc-1` will be created.


> To be continued...
