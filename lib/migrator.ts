const path = require("path");
const fs = require("fs");

const colors = require("colors");
const Pgb = require("pg-bluebird");

const _ = require("underscore");
const promise = require("bluebird");

var validateArgs = require("./validateArgs").default;
var messages = require("./messages");
var persisterProvider = new Pgb();

import MigratorService from "./migrator-service";
import ScriptService from "./script-service";
var VersionService = require("./version-service").default;
var VersionRepository = require("./version-repository").default;

const sql_path = "/Users/iwa/goku/db/"

async function run(argv: any): Promise<void> {
    // First argument : connectionString (mandatory)
    // Second argument : target version (optional)
    var args = argv.slice(2);

// Validation for args
    var {isValid, connectionString, targetVersion} = validateArgs(messages, argv.slice(2));

    const scriptService = new ScriptService(fs, path)

    if (!isValid) {
        console.log("invalid args")
        process.exit(1);
    }

    var connection, currentPersister;
    try {
        // Connecting to PostgreSQL
        connection = await persisterProvider.connect(connectionString)
        var persister = connection.client
        // connection = persister;
        // currentPersister = persister.client;


        const fileList = scriptService.getList(sql_path);

        const migratorService = new MigratorService(
            new VersionService(new VersionRepository(persister), messages),
            persister,
            messages);

        const currentVersion = await migratorService.migrate(fileList, targetVersion, scriptService);

        console.log(colors.grey("--------------------------------------------------"));
        console.log(colors.green(messages.MIGRATION_COMPLETED + currentVersion));
    } catch (err) {
        // Migration failed
        console.error(colors.red(messages.MIGRATION_ERROR + err));
        console.log(err)
    } finally {
        if (connection) {
            connection.done();
        }
    }
}

module.exports = run
