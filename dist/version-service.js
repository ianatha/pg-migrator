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
var VersionService = /** @class */ (function () {
    function VersionService(versionRepository, messages) {
        this._versionRepository = versionRepository;
        this._messages = messages;
    }
    VersionService.prototype.resolveUserTargetVersion = function (currentVersion, fileList, targetVersion) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (targetVersion == 0) {
                    // User didn't specify target version
                    // Looking for the file that has the biggest target version number
                    return [2 /*return*/, _.max(fileList, function (item) {
                            return item.targetVersion;
                        }).targetVersion];
                }
                else if (targetVersion == "+1") {
                    // One step forward request
                    return [2 /*return*/, currentVersion + 1];
                }
                else if (targetVersion == -1) {
                    // One step roll back request
                    if (currentVersion == 1) {
                        // DB in the initial state, can't go back no more
                        console.log(this._messages.NO_MORE_ROLLBACK.error);
                        throw new Error();
                    }
                    return [2 /*return*/, currentVersion - 1];
                }
                else {
                    return [2 /*return*/, targetVersion];
                }
                return [2 /*return*/];
            });
        });
    };
    VersionService.prototype.get = function () {
        return __awaiter(this, void 0, void 0, function () {
            var exists, currentVersion, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this._versionRepository.checkTable()];
                    case 1:
                        exists = _a.sent();
                        if (!!exists) return [3 /*break*/, 3];
                        // "version" table does not exist, will be created for the first time with version "1"
                        console.log(this._messages.FIRST_INITIALIZE.warn);
                        return [4 /*yield*/, this._versionRepository.createTable()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, 1];
                    case 3: return [4 /*yield*/, this._versionRepository.get()];
                    case 4:
                        currentVersion = _a.sent();
                        return [2 /*return*/, currentVersion];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_1 = _a.sent();
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    VersionService.prototype.update = function (version) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Update current version
                return [2 /*return*/, this._versionRepository.update(version)];
            });
        });
    };
    return VersionService;
}());
exports.default = VersionService;
//# sourceMappingURL=version-service.js.map