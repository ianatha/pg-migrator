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
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require('underscore');
var colors = require("colors");
var NO_TRANSACTION_BEGIN = '-- pg-migrator:without-transaction-begin';
var NO_TRANSACTION_END = '-- pg-migrator:without-transaction-end';
function runScript(fileContent, _persister) {
    return __awaiter(this, void 0, void 0, function () {
        var lines, blocks, last_no_transaction, _i, blocks_1, block, blockSql, _a, _b, blockStmt;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    lines = fileContent.split('\n');
                    blocks = [{ no_transaction: false, items: [] }];
                    last_no_transaction = false;
                    lines.forEach(function (line) {
                        if (line.indexOf(NO_TRANSACTION_BEGIN) == 0) {
                            last_no_transaction = true;
                        }
                        else if (line.indexOf(NO_TRANSACTION_END) == 0) {
                            last_no_transaction = false;
                        }
                        else {
                            var last_block = blocks[blocks.length - 1];
                            if (last_block.no_transaction == last_no_transaction) {
                                last_block.items.push(line);
                            }
                            else {
                                var new_block = {
                                    no_transaction: last_no_transaction,
                                    items: [line]
                                };
                                blocks.push(new_block);
                            }
                        }
                    });
                    _i = 0, blocks_1 = blocks;
                    _c.label = 1;
                case 1:
                    if (!(_i < blocks_1.length)) return [3 /*break*/, 11];
                    block = blocks_1[_i];
                    if (block.items.length == 0) {
                        return [3 /*break*/, 10];
                    }
                    blockSql = block.items.join("\n");
                    if (!block.no_transaction) return [3 /*break*/, 8];
                    console.log(colors.white("Running without transaction"));
                    return [4 /*yield*/, _persister.query('COMMIT')];
                case 2:
                    _c.sent();
                    _a = 0, _b = blockSql.split(';');
                    _c.label = 3;
                case 3:
                    if (!(_a < _b.length)) return [3 /*break*/, 6];
                    blockStmt = _b[_a];
                    return [4 /*yield*/, _persister.query(blockStmt)];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5:
                    _a++;
                    return [3 /*break*/, 3];
                case 6: 
                // let r = await this._persister.query('COMMIT; SELECT txid_current()');
                return [4 /*yield*/, _persister.query('BEGIN')];
                case 7:
                    // let r = await this._persister.query('COMMIT; SELECT txid_current()');
                    _c.sent();
                    return [3 /*break*/, 10];
                case 8:
                    console.log(colors.white("Running with transaction"));
                    return [4 /*yield*/, _persister.query(blockSql)];
                case 9:
                    _c.sent();
                    _c.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 1];
                case 11: return [2 /*return*/];
            }
        });
    });
}
var MigratorService = /** @class */ (function () {
    function MigratorService(versionService, persister, messages) {
        this._versionService = versionService;
        this._persister = persister;
        this._messages = messages;
    }
    MigratorService.prototype.migrate = function (fileList, userTargetVersion, scriptService) {
        return __awaiter(this, void 0, void 0, function () {
            var versionService, messages, currentVersion, targetVersion, direction, newVersion;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        versionService = this._versionService;
                        messages = this._messages;
                        if (fileList.length == 0) {
                            // There is no migration script file in current folder and subfolders
                            console.log(colors.red(messages.MIGRATION_SCRIPT_NOT_FOUND));
                            throw new Error();
                        }
                        return [4 /*yield*/, versionService.get()];
                    case 1:
                        currentVersion = _a.sent();
                        return [4 /*yield*/, versionService.resolveUserTargetVersion(currentVersion, fileList, userTargetVersion)];
                    case 2:
                        targetVersion = _a.sent();
                        console.log(colors.yellow(messages.CURRENT_VERSION + currentVersion));
                        console.log(colors.yellow((messages.TARGET_VERSION + targetVersion)));
                        if (currentVersion == targetVersion) {
                            // DB is already migrated to the target version
                            console.log(colors.green(messages.ALREADY_MIGRATED));
                            return [2 /*return*/, currentVersion];
                        }
                        if (currentVersion < targetVersion) {
                            // Forward migration
                            direction = 1;
                        }
                        else {
                            // Rollback migration
                            direction = -1;
                        }
                        return [4 /*yield*/, this.executeScripts(direction, fileList, currentVersion, targetVersion, scriptService)];
                    case 3:
                        newVersion = _a.sent();
                        console.log("New Version", newVersion);
                        return [4 /*yield*/, versionService.update(newVersion)];
                    case 4:
                        _a.sent();
                        // await this._persister.query("COMMIT");
                        return [2 /*return*/, newVersion];
                }
            });
        });
    };
    MigratorService.prototype.executeScripts = function (direction, fileList, startVersion, targetVersion, scriptService) {
        return __awaiter(this, void 0, void 0, function () {
            var messages, currentVersion, nextVersion, file, fileContent, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        messages = this._messages;
                        currentVersion = startVersion;
                        return [4 /*yield*/, this._persister.query("BEGIN TRANSACTION")];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!(currentVersion != targetVersion)) return [3 /*break*/, 9];
                        nextVersion = currentVersion + direction;
                        file = _.findWhere(fileList, { baseVersion: currentVersion, targetVersion: nextVersion });
                        if (!!file) return [3 /*break*/, 3];
                        // Migration file is not found. Probably some steps missing, stop migration
                        console.log(colors.red(messages.FILE_NOT_FOUND + currentVersion + "-" + nextVersion + ".sql"));
                        throw new Error();
                    case 3:
                        fileContent = scriptService.get(file.path);
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, runScript(fileContent, this._persister)];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        e_1 = _a.sent();
                        console.log("migration failed");
                        throw e_1;
                    case 7:
                        console.log(colors.grey("--------------------------------------------------"));
                        console.log(colors.green(currentVersion + "-" + nextVersion + ".sql executed"));
                        console.log(colors.grey("--------------------------------------------------"));
                        _a.label = 8;
                    case 8:
                        currentVersion = nextVersion;
                        return [3 /*break*/, 2];
                    case 9: return [4 /*yield*/, this._persister.query("COMMIT")];
                    case 10:
                        _a.sent();
                        return [2 /*return*/, currentVersion];
                }
            });
        });
    };
    return MigratorService;
}());
exports.default = MigratorService;
//# sourceMappingURL=migrator-service.js.map