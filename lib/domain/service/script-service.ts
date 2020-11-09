interface FileDecl {
    baseVersion: string,
    targetVersion: string,
    path: string
}

export default class ScriptService {
    private _fs: any;
    private _path: any;

    constructor(fs: any, path: any) {
        this._fs = fs;
        this._path = path;
    }

    get(path: string): string {
        return this._fs.readFileSync(path, "utf8");
    }

    _getList(path: string) {
        return this._fs.readdirSync(path);
    }

    _getStat(path: string) {
        return this._fs.statSync(path)
    }

    getList(currentPath: string): FileDecl[] {
        var sqlFiles: FileDecl[] = [];

        var files = this._getList(currentPath);

        // Looking for all files in the path directory and all sub directories recursively
        for (var i in files) {
            if (!files.hasOwnProperty(i)) {
                continue;
            }

            var fullPath = currentPath + '/' + files[i];

            var stats = this._getStat(fullPath);

            if (stats.isDirectory()) {

                sqlFiles = sqlFiles.concat(this._getList(fullPath));

            } else if (stats.isFile()) {

                // Files must have an extension with ".sql" (case insensitive)
                // with and "x-y.sql" format that x and y must be valid numbers
                // Both numbers also must be sequential
                // All other files will be ignored
                if (this._path.extname(fullPath).toUpperCase() == ".SQL") {

                    var fileName = this._path.basename(fullPath, '.sql');

                    // There is no "-" sign, ignore the file
                    if (fileName.indexOf("-") == -1) {
                        continue;
                    }

                    // "x-y.sql"
                    // x: base version
                    // y: target version
                    var baseVersion = fileName.substr(0, fileName.indexOf("-"));
                    var targetVersion = fileName.substr(fileName.indexOf("-") + 1);

                    // x or y is not a valid number, ignore the file
                    if (!baseVersion || !targetVersion || isNaN(baseVersion) || isNaN(targetVersion)) {

                        continue;
                    }

                    // Make sure we use integers
                    baseVersion = parseInt(baseVersion);
                    targetVersion = parseInt(targetVersion);

                    // x and y are not sequential, ignore the file
                    if (Math.abs(baseVersion - targetVersion) != 1) {

                        continue;
                    }

                    sqlFiles.push({baseVersion: baseVersion, targetVersion: targetVersion, path: fullPath});
                }
            }
        }

        return sqlFiles;
    }
}
