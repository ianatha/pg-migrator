import VersionRepository from '../repository/version-repository';

export default class VersionService {
    private _versionRepository: any;
    private _messages: any;

    constructor(versionRepository: VersionRepository, messages: any) {
        this._versionRepository = versionRepository;
        this._messages = messages;
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