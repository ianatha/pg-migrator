export default class VersionRepository {
    constructor(persister) {
        this._persister = persister;
    }

    async checkTable() {
        const result = await this._persister.query("SELECT EXISTS(SELECT * FROM information_schema.tables  WHERE table_name = 'version') as value;");
        return result.rows[0].value;
    }

    async createTable() {
        return this._persister.query("CREATE TABLE version (value INT);INSERT INTO version(value) VALUES(1);");
    }

    async get() {
        const result = await this._persister.query("SELECT value FROM version;");
        return result.rows[0].value;
    }

    async update(version) {
        return this._persister.query("UPDATE version SET value = $1;", [version]);
    }
}
