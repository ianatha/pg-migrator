const _ = require('underscore');
import VersionRepository from '../repository/version-repository';

export default class VersionService {
    private _versionRepository: any;
    private _messages: any;

    constructor(versionRepository: VersionRepository, messages: any) {
        this._versionRepository = versionRepository;
        this._messages = messages;
    }

    async resolveUserTargetVersion(currentVersion: number, fileList: any[], targetVersion: number|string): Promise<string|number> {
        if (targetVersion == 0) {
            // User didn't specify target version
            // Looking for the file that has the biggest target version number
            return _.max(fileList, function (item: any) {
                return item.targetVersion;
            }).targetVersion;
        } else if (targetVersion == "+1") {
            // One step forward request
            return currentVersion + 1;
        } else if (targetVersion == -1) {
            // One step roll back request
            if (currentVersion == 1) {
                // DB in the initial state, can't go back no more
                console.log(this._messages.NO_MORE_ROLLBACK.error);
                throw new Error();
            }
            return currentVersion - 1;
        } else {
            return targetVersion;
        }
    }

    async get(): Promise<number> {
        // check if "version" table exists in db
        try {
            const exists = await this._versionRepository.checkTable()

            if (!exists) {
                // "version" table does not exist, will be created for the first time with version "1"
                console.log(this._messages.FIRST_INITIALIZE.warn);

                await this._versionRepository.createTable();
                return 1
            } else {
                // Get the current version from db
                const currentVersion = await this._versionRepository.get()
                return currentVersion;
            }
        } catch(error) {
            throw error;
        }
    }

    async update(version: number): Promise<number> {
        // Update current version
        return this._versionRepository.update(version);
    }
}
