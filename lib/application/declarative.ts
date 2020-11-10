const fs = require("fs");
const path = require("path");
const colors = require("colors");
const { Client } = require('pg');
import pgStructure from 'pg-structure';

const p = require('pg-query-parser');

interface Type {
    name: string;
    schema?: string;
}

const INTEGER: Type = {
    name: "integer"
};

const TIMESTAMP_TZ: Type = {
    name: "timestamp with time zone"
}

const BIGINT: Type = {
    name: "bigint"
};

const schema_PUBLIC: Schema = {
    name: "public"
}

interface Schema {
    name: string
}

interface TableColumn {
    name: string
    type: Type
    notNull: boolean
    defaultValue: string | undefined
}

interface TableBuilder {
    schema: Schema
    name: string
    _comment?: string
    columns: TableColumn[]

    comment(c: string): TableBuilder
    column(name: string, type: Type, notNull?: boolean, defaultValue?: string): TableBuilder
    ddl(): string
}

function column_ddl(t: Type): string {
    if (t.schema) {
        return t.schema + "." + t.name
    } else {
        return t.name
    }
}

function table(schema: Schema, name: string): TableBuilder {
    let self: TableBuilder = {
        schema,
        name,
        _comment: undefined,
        columns: [],
        comment(c: string): TableBuilder {
            self._comment = c
            return self
        },
        column(name: string, type: Type, notNull: boolean = false, defaultValue?: string): TableBuilder {
            let c: TableColumn = {
                name,
                type,
                notNull,
                defaultValue
            }
            self.columns.push(c)
            return self
        },
        ddl(): string {
            return `CREATE TABLE ${self.schema.name}.${self.name} (\n`
                + self.columns.map(c => {
                    const not_null = (c.notNull ? " NOT NULL" : "")
                    const default_val = (c.defaultValue ? ` DEFAULT ${c.defaultValue}` : "")
                    return `    ${c.name} ${column_ddl(c.type)}${default_val}${not_null}`
                }).join(',\n')
                + '\n);'

        }
    }
    return self
}


// console.log(p.parse(fs.readFileSync('func.sql')))
// process.exit(1)
// {
//     "name": "public.version",
//     "columns": [
//     {
//         "name": "value-test",
//         "parent": "###version",
//         "notNull": false,
//         "type": "###integer",
//         "arrayDimension": 0,
//         "defaultWithTypeCast": null,
//         "attributeNumber": 1
//     },
//     {
//         "name": "value2",
//         "parent": "###version",
//         "notNull": false,
//         "type": "###string",
//         "arrayDimension": 0,
//         "defaultWithTypeCast": null,
//         "attributeNumber": 1
//     }
// ],
//     "triggers": [],
//     "constraints": [],
//     "indexes": []
// }
interface STable {
    name: string | null;
    comment: string | undefined;
    columns: any[];
    triggers: any[];
    indexes: any[];
    constraints: any[];
}

function deref(c: any): any {
    for (let k in c) {
        let v = c[k];
        if (v && v.hasOwnProperty && v.hasOwnProperty('name')) {
            c[k] = "###" + v.name;
        }
    }
    return c;
}

function fix_column(c: any): any {
    if (c.arrayDimension === 0) {
        delete c.arrayDimension
    }
    if (c.notNull === false) {
        delete c.notNull
    }
    if (c.defaultWithTypeCast === null) {
        delete c.defaultWithTypeCast
    }
    return c
}

async function exporttables() {
    const db = await pgStructure({database: "prod", user: "postgres", password: "postgres"},
        {includeSchemas: ["public", "security", "static"]});

    db.tables.forEach(e => {
        let r: STable = {
            name: e.schema.name +"."+e.name,
            comment: e.comment,
            columns: e.columns.map(deref).map(fix_column),
            triggers: e.triggers.map(deref),
            constraints: e.constraints.map(deref),
            indexes: e.indexes.map(deref)

                // c => {
                // return {...c, parent: null, type: c.type.name}
            // }),
            // triggers: e.triggers.map(deref)
        };

        let content = JSON.stringify(r, undefined, 2);

        fs.writeFileSync("ddd/" + r.name+".json", content)
    })
}

const diff = require('json0-ot-diff');
var diffMatchPatch = require("diff-match-patch");

var equal = require("deep-equal");

function last(x: any[]): any {
    return x[x.length-1]
}

function optimize2(ops: any[]) {
    /*
    Optimization loop where we attempt to find operations that needlessly inserts and deletes identical objects right
    after each other, and then consolidate them.
     */
    for (var i=ops.length-1; i > 0; i--) {
        var a = ops[i], b = ops[i-1];

        // The ops must have same path.
        if (!equal(a.p.slice(0, -1), b.p.slice(0, -1))) {
            continue;
        }

        // The indices must be successive.
        if (last(a.p) - 1 !== last(b.p)) {
            continue;
        }

        // The first operatin must be an insertion and the second a deletion.
        if (!a.li || !b.ld) {
            continue;
        }

        // The object we insert must be equal to what we delete next.
        if (!equal(a.li, b.ld)) {
            continue;
        }

        delete a.li;
        delete b.ld;
    }

    ops = ops.filter(function(op) {
        return Object.keys(op).length > 1;
    });

    return ops;
}


function optimize3(ops: any[]) {
    /*
    Optimization loop where we attempt to find operations that needlessly inserts and deletes identical objects right
    after each other, and then consolidate them.
     */
    for (var i=0; i < ops.length - 1; i++) {
        var a = ops[i], b = ops[i+1];
        console.log();
        console.log();
        console.log(a);
        console.log(b);

        // The ops must have same path.
        if (!equal(a.p.slice(0, -1), b.p.slice(0, -1))) {
            console.log('no path')
            continue;
        }

        if (a.od == undefined || b.od == undefined) {
            console.log("no od")
            continue;
        }

        console.log('del')
        let la = last(a.p);
        let lb = last(b.p);
        a.p = [];
        b.p = b.p.splice(0, -1);
        b.objset = {}
        b.objset[la] = 'TODO'
        b.objset[lb] = 'TODO'
    }

    ops = ops.filter(function(op) {
        return op.p.length > 0;
    });

    return ops;
}
async function difftest() {
    const f1 = JSON.parse(fs.readFileSync("ddd/public.version.json"))
    const f2 = JSON.parse(fs.readFileSync("ddd/public.version.ne.json"))
    console.log(f1)

    var kk = {}
    f1.columns.forEach((v:any) => {
        // @ts-ignore
        kk[v.name] = v
    })

    console.log(kk)

    console.log((diff(f1, f2)))
}

async function testasss() {
    const table_public_version =
        table(schema_PUBLIC, 'version')
            .column('value', INTEGER, false)

    console.log(table_public_version.ddl());
    console.assert(
        table_public_version.ddl() ==
        "CREATE TABLE public.version (\n" +
        "    value integer\n" +
        ");"
    )

    const account_type: Type = {
        schema: "public",
        name: "account_type"
    }

    const label: Type = {
        schema: "public",
        name: "label"
    }

    const broker: Type = {
        schema: "public",
        name: "broker"
    }

    const t2s = "CREATE TABLE public.account (\n" +
        "    account_id bigint NOT NULL,\n" +
        "    company_id bigint,\n" +
        "    account_type public.account_type NOT NULL,\n" +
        "    broker public.broker,\n" +
        "    name public.label,\n" +
        "    created_at timestamp with time zone DEFAULT now() NOT NULL\n" +
        ");"

    const t2 =
        table(schema_PUBLIC, 'account')
            .comment('An company level account, a company has one for each type of plan contribution.')
            .column('account_id', BIGINT, true)
            .column('company_id', BIGINT)
            .column('account_type', account_type, true)
            .column('broker', broker)
            .column('name', label)
            .column('created_at', TIMESTAMP_TZ, true, "now()")

    console.log(t2.ddl());
    console.log(t2s);
    console.assert(t2.ddl() == t2s);
}

let mainfn = testasss;

mainfn().then(function() {
    console.log("done")
}).catch(function(err) {
    console.log("errror")
    console.log(err)
})
