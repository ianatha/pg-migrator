export default class ScriptRepository {
    constructor(fs, persister) {
        this._fs = fs;
        this._persister = persister;
    }

    get(path) {
        return this._fs.readFileSync(path, "utf8");
    }

    execute(query) {
        return this._persister.query(query);
    }

    getList(path) {
        return this._fs.readdirSync(path);
    }

    getStat(path) {
        return this._fs.statSync(path)
    }
}
