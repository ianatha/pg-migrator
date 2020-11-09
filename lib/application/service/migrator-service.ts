const _ = require('underscore');
const colors = require('colors')

export default class MigratorService {
    private _scriptService: any;
    private _versionService: any;
    private _messages: any;

    constructor(scriptService: any, versionService: any, messages: any) {
        this._scriptService = scriptService;
        this._versionService = versionService;
        this._messages = messages;
    }

    async migrate(currentPath: string, targetVersion: any): Promise<number> {
        var scriptService = this._scriptService;
        var versionService = this._versionService;
        var messages = this._messages;

        // Getting valid migration script files ("x-y.sql")
        var fileList = scriptService.getList(currentPath);

        if (fileList.length == 0) {
            // There is no migration script file in current folder and subfolders
            console.log(messages.MIGRATION_SCRIPT_NOT_FOUND.error);

            throw new Error();
        } else {
            // Getting current db version
            const currentVersion = await versionService.get()

            if (targetVersion == 0) {
                // User didn't specify target version
                // Looking for the file that has the biggest target version number
                targetVersion = _.max(fileList, function (item: any) {
                    return item.targetVersion;
                }).targetVersion;
            } else if (targetVersion == "+1") {
                // One step forward request
                targetVersion = currentVersion + 1;
            } else if (targetVersion == -1) {
                // One step roll back request
                if (currentVersion == 1) {
                    // DB in the initial state, can't go back no more
                    console.log(messages.NO_MORE_ROLLBACK.error);
                    throw new Error();
                }
                targetVersion = currentVersion - 1;
            }

            console.log((messages.CURRENT_VERSION + currentVersion).verbose);
            console.log((messages.TARGET_VERSION + targetVersion).verbose);

            if (currentVersion == targetVersion) {
                // DB is already migrated to the target version
                console.log(messages.ALREADY_MIGRATED.warn);
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
            await this.executeScript(direction, fileList, currentVersion, targetVersion)
            await versionService.update(targetVersion);
            return targetVersion;
        }
    }

    async executeScript(direction: any, fileList: any, currentVersion: any, targetVersion: any): Promise<number> {
        var scriptService = this._scriptService;
        var messages = this._messages;

        // Calculate the version after migration step according to direction
        var nextVersion = currentVersion + direction;

        // Get migration step file
        var file = _.findWhere(fileList, {baseVersion: currentVersion, targetVersion: nextVersion});

        if (!file) {
            // Migration file is not found. Probably some steps missing, stop migration
            console.log(colors.red(messages.FILE_NOT_FOUND + currentVersion + "-" + nextVersion + ".sql"));
            throw new Error();
        } else {
            // Get migration step script file content
            var fileContent = scriptService.get(file.path);

            // Execute migration step script file
            await scriptService.execute(fileContent);

            console.log(colors.grey("--------------------------------------------------"));
            console.log(colors.white(fileContent));
            console.log(colors.green(currentVersion + "-" + nextVersion + ".sql executed"));
            console.log(colors.grey("--------------------------------------------------"));

            // Update current version
            currentVersion += direction;

            if (currentVersion == targetVersion) {
                // Reached to target version, migration completed
                return currentVersion;
            } else {
                // Recursive call until reach to target version
                this.executeScript(direction, fileList, currentVersion, targetVersion);
                return targetVersion;
            }
        }
    }
}
