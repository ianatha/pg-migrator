const fs = require("fs");
const path = require("path");
const colors = require("colors");
const Pgb = require("pg-bluebird");

const _ = require("underscore");
const promise = require("bluebird");

var ValidationService = require("./service/validation-service");
var messages = require("../infrastructure/messages");
var persisterProvider = new Pgb();

var getMigrationService = function (persister) {
    var MigratiorService = require("./service/migrator-service");
    var ScriptService = require("../domain/service/script-service");
    var VersionService = require("../domain/service/version-service");
    var ScriptRepository = require("../domain/repository/script-repository");
    var VersionRepository = require("../domain/repository/version-repository");


    // Service definition with dependency injection
    return new MigratiorService(
        new ScriptService(new ScriptRepository(fs, persister), path),
        new VersionService(new VersionRepository(persister), messages),
        messages);
};

async function run(argv) {
    colors.setTheme({
        verbose: 'cyan',
        info: 'green',
        warn: 'yellow',
        error: 'red'
    });

// First argument : connectionString (mandatory)
// Second argument : target version (optional)
    var args = argv.slice(2);

// Validation for args
    var isValid = new ValidationService(messages).validate(args);

    if (!isValid) {
        process.exit(1);
    }

    var connectionString = args[0];
    var targetVersion = 0;

    // if targetVersion stays 0 means that, target version does not provided by user
    // so it will be obtained from script files (the biggest target version number in all files)
    if (args.length > 1) {

        targetVersion = args[1];
    }

    var connection, currentPersister, currentVersion;
    try {
        // Connecting to PostgreSQL
        const persister = await persisterProvider.connect(connectionString)

        connection = persister;
        currentPersister = persister.client;

        await currentPersister.query("BEGIN TRANSACTION");
        const curVer = await getMigrationService(currentPersister).migrate(".", targetVersion);

        currentVersion = curVer;

        await currentPersister.query("COMMIT");

        connection.done();

        console.log("--------------------------------------------------".grey);
        console.log((messages.MIGRATION_COMPLETED + currentVersion).info);

        process.exit(0);
    } catch (error) {
        // Migration failed

        if (error) {
            console.error((messages.MIGRATION_ERROR + error).error);
        }

        if (connection) {
            connection.done();
        }

        process.exit(1);
    }
}

module.exports = run
