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

To create a `Balancer` account (which is defined in the `accounts/balancer.js`),
specify the `--type=Balancer` when creating, like:

    $ [node] ./cli/create-account.js --type=Balancer sys-1

A new account with type `balancer` and key `sys-1` will be created.


## Getting accounts

To get existing account from the database, call:

    $ [node] ./cli/get-account.js --key=acc-1

Accounts are also can be gotten by their internal id, for example:

    $ [node] ./cli/get-account.js --id=4563


## Updating accounts

As well as `get-account` the `update-account` operation requires the `--key`
or `--id` flag to get an account instance for updating.  And as of updating,
use `--set-$field=$value`_-like_ flags to update fields' values.

Here are some examples:

```bash
# suspend account with key 'acc-1'
$ [node] ./cli/update-account.js --key=acc-1 --set-status=suspended

# update the "postpaid" property of the account with key 'sys-1'
$ [node] ./cli/update-account.js --key=sys-1 --set-postpaid=true

# change the account 'key' referencing it by its internal id
$ [node] ./cli/update-account.js --id=4563 --set-key=acc-2

# the --set-* flags can be combined to perform update in a single operation
$ [node] ./cli/update-account.js --id=4563 --set-key=sys-2 --set-type=Balancer --set-postpaid=true
```

## Deleting accounts

It is highly **not recommended** to delete accounts physically,
so if you want to delete an account, mark it as `deleted`, like:

    $ [node] ./cli/update-account.js --key=acc-2 --set-status=deleted


> To be continued...
