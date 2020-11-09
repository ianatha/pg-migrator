export default class ScriptRepository {
    private _fs: any;
    private _persister: any;

    constructor(fs: any, persister: any) {
        this._fs = fs;
        this._persister = persister;
    }

    get(path: string): string {
        return this._fs.readFileSync(path, "utf8");
    }

    execute(query: string): any {
        return this._persister.query(query);
    }

    getList(path: string): any {
        return this._fs.readdirSync(path);
    }

    getStat(path: string): any {
        return this._fs.statSync(path)
    }
}
