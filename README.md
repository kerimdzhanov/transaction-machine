# Transaction Machine

Event-oriented financial transactions processing mechanism for Node.js/PostgreSQL.


## Installation

    $ npm install transaction-machine --save


## Setting up the database

To generate database setup files, from the root directory of your project, call:

    $ [node] ./node_modules/transaction-machine/db/generate-setup-files.js

The above will create `db/config.json` (with default database configurations)
and basic migration files in the `db/migrations` directory of your project.

To run these migrations, call:

    $ [node] ./node_modules/transaction-machine/db/migrate.js up

> The `db/migrate.js` executable simply proxies all calls to [node-db-migrate](https://www.npmjs.com/package/db-migrate) just specifying the project-specific configuration.
Refer to the [node-db-migrate's usage docs](http://umigrate.readthedocs.org/projects/db-migrate/en/latest/Getting%20Started/usage/) to learn more about using the `db/migrate.js`.


## Running tests

    $ make test


## License

MIT &copy; 2016 Dan Kerimdzhanov
