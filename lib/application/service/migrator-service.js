export default class MigratorService {
    constructor(scriptService, versionService, messages) {
        this._scriptService = scriptService;
        this._versionService = versionService;
        this._messages = messages;
    }

    async migrate(currentPath, targetVersion) {
        var scriptService = this._scriptService;
        var versionService = this._versionService;
        var messages = this._messages;
        var that = this;

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
                targetVersion = _.max(fileList, function (item) {
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

    async executeScript(direction, fileList, currentVersion, targetVersion) {
        var scriptService = this._scriptService;
        var messages = this._messages;
        var executeScript = this._executeScript;
        var that = this;

        // Calculate the version after migration step according to direction
        var nextVersion = currentVersion + direction;

        // Get migration step file
        var file = _.findWhere(fileList, {baseVersion: currentVersion, targetVersion: nextVersion});

        if (!file) {
            // Migration file is not found. Probably some steps missing, stop migration
            console.log((messages.FILE_NOT_FOUND + currentVersion + "-" + nextVersion + ".sql").error);
            throw new Error();
        } else {
            // Get migration step script file content
            var fileContent = scriptService.get(file.path);

            // Execute migration step script file
            await scriptService.execute(fileContent);

            console.log("--------------------------------------------------".grey);
            console.log(fileContent.white);
            console.log((currentVersion + "-" + nextVersion + ".sql executed").info);
            console.log("--------------------------------------------------".grey);

            // Update current version
            currentVersion += direction;

            if (currentVersion == targetVersion) {
                // Reached to target version, migration completed
                return currentVersion;
            } else {
                // Recursive call until reach to target version
                await executeScript.call(that, direction, fileList, currentVersion, targetVersion);
                return targetVersion;
            }
        }
    }
}
