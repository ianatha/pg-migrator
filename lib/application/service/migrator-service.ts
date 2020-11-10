const _ = require('underscore');
const colors = require("colors");

const NO_TRANSACTION_BEGIN = '-- pg-migrator:without-transaction-begin';

const NO_TRANSACTION_END = '-- pg-migrator:without-transaction-end';

import VersionService from '../../domain/service/version-service';
import ScriptService from '../../domain/service/script-service';

async function runScript(fileContent: string, _persister: any) {
    const lines = fileContent.split('\n');

    var blocks: any[] = [{no_transaction: false, items: []}];
    var last_no_transaction = false;
    lines.forEach(line => {
        if (line.indexOf(NO_TRANSACTION_BEGIN) == 0) {
            last_no_transaction = true;
        } else if (line.indexOf(NO_TRANSACTION_END) == 0) {
            last_no_transaction = false;
        } else {
            let last_block = blocks[blocks.length - 1]
            if (last_block.no_transaction == last_no_transaction) {
                last_block.items.push(line)
            } else {
                let new_block = {
                    no_transaction: last_no_transaction,
                    items: [line]
                }
                blocks.push(new_block)
            }
        }
    })

    // console.log(blocks)
    for (const block of blocks) {
        if (block.items.length == 0) {
            continue;
        }

        console.log(block.no_transaction);
        const blockSql = block.items.join("\n")
        if (block.no_transaction) {
            console.log("running no transaction")
            await _persister.query('COMMIT');
            for (var blockStmt of blockSql.split(';')) {
                await _persister.query(blockStmt)
            }
            // let r = await this._persister.query('COMMIT; SELECT txid_current()');
            await _persister.query('BEGIN');
            // console.log(blockSql)

            // await this._persister.query('BEGIN TRANSACTION;');
            // console.log(blockSql)
        } else {
            await _persister.query(blockSql);
        }
    }
}

export default class MigratorService {
    private _versionService: VersionService;
    private _messages: any;
    private _persister: any;

    constructor(versionService: VersionService, persister: any, messages: any) {
        this._versionService = versionService;
        this._persister = persister;
        this._messages = messages;
    }

    async migrate(fileList: any[], userTargetVersion: string|number, scriptService: ScriptService): Promise<number> {
        var versionService = this._versionService;
        var messages = this._messages;

        if (fileList.length == 0) {
            // There is no migration script file in current folder and subfolders
            console.log(colors.red(messages.MIGRATION_SCRIPT_NOT_FOUND));

            throw new Error();
        }

        // await this._persister.query("BEGIN TRANSACTION");

        // Getting current db version
        var currentVersion = await versionService.get()
        const targetVersion = await versionService.resolveUserTargetVersion(currentVersion, fileList, userTargetVersion)

        console.log(colors.yellow(messages.CURRENT_VERSION + currentVersion));
        console.log(colors.yellow((messages.TARGET_VERSION + targetVersion)));

        if (currentVersion == targetVersion) {
            // DB is already migrated to the target version
            console.log(colors.green(messages.ALREADY_MIGRATED));
            return currentVersion;
        }

        var direction;
        if (currentVersion < targetVersion) {
            // Forward migration
            direction = 1;
        } else {
            // Rollback migration
            direction = -1;
        }

        // Recursively call "executeScript" function until reach to target version
        const newVersion = await this.executeScripts(direction, fileList, currentVersion, targetVersion, scriptService)
        console.log(newVersion)
        await versionService.update(newVersion);

        // await this._persister.query("COMMIT");

        return newVersion;
    }

    async executeScripts(direction: number, fileList: any[], startVersion: number, targetVersion: string | number, scriptService: ScriptService) {
        var messages = this._messages;

        // Calculate the version after migration step according to direction
        var currentVersion = startVersion;

        while (currentVersion != targetVersion) {
            var nextVersion = currentVersion + direction;
            var file = _.findWhere(fileList, {baseVersion: currentVersion, targetVersion: nextVersion});

            if (!file) {
                // Migration file is not found. Probably some steps missing, stop migration
                console.log(colors.red(messages.FILE_NOT_FOUND + currentVersion + "-" + nextVersion + ".sql"));
                throw new Error();
            } else {
                // Get migration step script file content
                var fileContent = scriptService.get(file.path);

                // Execute migration step script file
                try {
                    await runScript(fileContent, this._persister)
                } catch (e) {
                    console.log("migration failed")
                    throw e;
                }

                console.log(colors.grey("--------------------------------------------------"));
                console.log(colors.green(currentVersion + "-" + nextVersion + ".sql executed"));
                console.log(colors.grey("--------------------------------------------------"));
            }

            currentVersion = nextVersion
        }

        return currentVersion
    }
}
