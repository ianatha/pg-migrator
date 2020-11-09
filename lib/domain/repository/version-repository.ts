export default class VersionRepository {
    private _persister: any;

    constructor(persister: any) {
        this._persister = persister;
    }

    async checkTable(): Promise<boolean> {
        const result = await this._persister.query("SELECT EXISTS(SELECT * FROM information_schema.tables  WHERE table_name = 'version') as value;");
        return result.rows[0].value;
    }

    async createTable(): Promise<void> {
        return this._persister.query("CREATE TABLE version (value INT);INSERT INTO version(value) VALUES(1);");
    }

    async get(): Promise<number> {
        const result = await this._persister.query("SELECT value FROM version;");
        return result.rows[0].value;
    }

    async update(version: number): Promise<number> {
        return this._persister.query("UPDATE version SET value = $1;", [version]);
    }
}
