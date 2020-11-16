"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var fs = require("fs");
var path = require("path");
var colors = require("colors");
// const { Client } = require('pg');
// import pgStructure from 'pg-structure';
var pgStructure = require('pg-structure');
var INTEGER = {
    name: "integer"
};
var TIMESTAMP_TZ = {
    name: "timestamp with time zone"
};
var BIGINT = {
    name: "bigint"
};
var schema_PUBLIC = {
    name: "public"
};
function column_ddl(t) {
    if (t.schema) {
        return t.schema + "." + t.name;
    }
    else {
        return t.name;
    }
}
function table(schema, name) {
    var columns = [];
    var self = {
        schema: schema,
        name: name,
        _comment: undefined,
        columns: columns,
        comment: function (c) {
            self._comment = c;
            return self;
        },
        column: function (name, type, notNull, defaultValue) {
            if (notNull === void 0) { notNull = false; }
            var c = {
                name: name,
                type: type,
                notNull: notNull,
                defaultValue: defaultValue
            };
            self.columns.push(c);
            return self;
        },
        ddl: function () {
            return "CREATE TABLE " + self.schema.name + "." + self.name + " (\n"
                + self.columns.map(function (c) {
                    var not_null = (c.notNull ? " NOT NULL" : "");
                    var default_val = (c.defaultValue ? " DEFAULT " + c.defaultValue : "");
                    return "    " + c.name + " " + column_ddl(c.type) + default_val + not_null;
                }).join(',\n')
                + '\n);';
        }
    };
    return self;
}
function deref(c) {
    for (var k in c) {
        var v = c[k];
        if (v && v.hasOwnProperty && v.hasOwnProperty('name')) {
            c[k] = "###" + v.name;
        }
    }
    return c;
}
function fix_column(c) {
    if (c.arrayDimension === 0) {
        delete c.arrayDimension;
    }
    if (c.notNull === false) {
        delete c.notNull;
    }
    if (c.defaultWithTypeCast === null) {
        delete c.defaultWithTypeCast;
    }
    return c;
}
function exporttables() {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pgStructure({ database: "prod", user: "postgres", password: "postgres" }, { includeSchemas: ["public", "security", "static"] })];
                case 1:
                    db = _a.sent();
                    db.tables.forEach(function (e) {
                        var r = {
                            name: e.schema.name + "." + e.name,
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
                        var content = JSON.stringify(r, undefined, 2);
                        fs.writeFileSync("ddd/" + r.name + ".json", content);
                    });
                    return [2 /*return*/];
            }
        });
    });
}
var diff = require('json0-ot-diff');
var diffMatchPatch = require("diff-match-patch");
var equal = require("deep-equal");
function last(x) {
    return x[x.length - 1];
}
function optimize2(ops) {
    /*
    Optimization loop where we attempt to find operations that needlessly inserts and deletes identical objects right
    after each other, and then consolidate them.
     */
    for (var i = ops.length - 1; i > 0; i--) {
        var a = ops[i], b = ops[i - 1];
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
    ops = ops.filter(function (op) {
        return Object.keys(op).length > 1;
    });
    return ops;
}
function optimize3(ops) {
    /*
    Optimization loop where we attempt to find operations that needlessly inserts and deletes identical objects right
    after each other, and then consolidate them.
     */
    for (var i = 0; i < ops.length - 1; i++) {
        var a = ops[i], b = ops[i + 1];
        console.log();
        console.log();
        console.log(a);
        console.log(b);
        // The ops must have same path.
        if (!equal(a.p.slice(0, -1), b.p.slice(0, -1))) {
            console.log('no path');
            continue;
        }
        if (a.od == undefined || b.od == undefined) {
            console.log("no od");
            continue;
        }
        console.log('del');
        var la = last(a.p);
        var lb = last(b.p);
        a.p = [];
        b.p = b.p.splice(0, -1);
        b.objset = {};
        b.objset[la] = 'TODO';
        b.objset[lb] = 'TODO';
    }
    ops = ops.filter(function (op) {
        return op.p.length > 0;
    });
    return ops;
}
function difftest() {
    return __awaiter(this, void 0, void 0, function () {
        var f1, f2, kk;
        return __generator(this, function (_a) {
            f1 = JSON.parse(fs.readFileSync("ddd/public.version.json"));
            f2 = JSON.parse(fs.readFileSync("ddd/public.version.ne.json"));
            console.log(f1);
            kk = {};
            f1.columns.forEach(function (v) {
                // @ts-ignore
                kk[v.name] = v;
            });
            console.log(kk);
            console.log((diff(f1, f2)));
            return [2 /*return*/];
        });
    });
}
function testasss() {
    return __awaiter(this, void 0, void 0, function () {
        var table_public_version, account_type, label, broker, t2s, t2;
        return __generator(this, function (_a) {
            table_public_version = table(schema_PUBLIC, 'version')
                .column('value', INTEGER, false);
            console.log(table_public_version.ddl());
            console.assert(table_public_version.ddl() ==
                "CREATE TABLE public.version (\n" +
                    "    value integer\n" +
                    ");");
            account_type = {
                schema: "public",
                name: "account_type"
            };
            label = {
                schema: "public",
                name: "label"
            };
            broker = {
                schema: "public",
                name: "broker"
            };
            t2s = "CREATE TABLE public.account (\n" +
                "    account_id bigint NOT NULL,\n" +
                "    company_id bigint,\n" +
                "    account_type public.account_type NOT NULL,\n" +
                "    broker public.broker,\n" +
                "    name public.label,\n" +
                "    created_at timestamp with time zone DEFAULT now() NOT NULL\n" +
                ");";
            t2 = table(schema_PUBLIC, 'account')
                .comment('An company level account, a company has one for each type of plan contribution.')
                .column('account_id', BIGINT, true)
                .column('company_id', BIGINT)
                .column('account_type', account_type, true)
                .column('broker', broker)
                .column('name', label)
                .column('created_at', TIMESTAMP_TZ, true, "now()");
            console.log(t2.ddl());
            console.log(t2s);
            console.assert(t2.ddl() == t2s);
            return [2 /*return*/];
        });
    });
}
var mainfn = testasss;
mainfn().then(function () {
    console.log("done");
}).catch(function (err) {
    console.log("errror");
    console.log(err);
});
//# sourceMappingURL=declarative.js.map