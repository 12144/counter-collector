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
exports.__esModule = true;
/**
 * 此对象的功能有
 * 1.初始化本读存储对象单例
 * 2.采集数据存储至本地存储对象中
 * 3.定时批量将本地存储数据上传至服务器
 */
var CounterStorage_1 = require("./CounterStorage");
var index_1 = require("./request/index");
var test_1 = require("./test");
var counterStorage = Symbol("counterStorage");
var counterInterval = Symbol("counterInterval");
var CounterCollector = /** @class */ (function () {
    function CounterCollector() {
    }
    /**
   * 初始化，在window上挂载一个单例作为本地存储
   * @param interval 采集间隔，单位ms，默认是10分钟
   */
    CounterCollector.init = function (interval) {
        if (interval === void 0) { interval = 1000 * 60 * 10; }
        if (!CounterCollector[counterStorage]) {
            CounterCollector[counterStorage] = new CounterStorage_1["default"]();
        }
        if (!CounterCollector[counterInterval]) {
            CounterCollector[counterInterval] = setInterval(function () {
                CounterCollector.upload();
            }, interval);
        }
    };
    CounterCollector.getUserId = function (user_id, ip) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (user_id)
                            return [2 /*return*/, user_id];
                        if (!!ip) return [3 /*break*/, 2];
                        return [4 /*yield*/, index_1.getUserIP()];
                    case 1:
                        result = _a.sent();
                        ip = result.data;
                        _a.label = 2;
                    case 2: return [2 /*return*/, JSON.stringify({
                            ip: ip,
                            userAgent: navigator.userAgent
                        })];
                }
            });
        });
    };
    CounterCollector.getSessionId = function (session_id, user_id, cookie_id, ip) {
        return __awaiter(this, void 0, void 0, function () {
            var now, identifier, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (session_id)
                            return [2 /*return*/, session_id];
                        now = new Date();
                        identifier = user_id || cookie_id || ip + "|" + navigator.userAgent;
                        if (!!identifier) return [3 /*break*/, 2];
                        return [4 /*yield*/, index_1.getUserIP()];
                    case 1:
                        result = _a.sent();
                        identifier = result.data + "|" + navigator.userAgent;
                        _a.label = 2;
                    case 2: return [2 /*return*/, identifier + "|" + now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + "|" + now.getHours()];
                }
            });
        });
    };
    /**
   * 采集有效的数据
   * 标识符规则见counter标准https://www.projectcounter.org/code-of-practice-five-sections/7-processing-rules-underlying-counter-reporting-data/
   * @param user_id 用户标识符
   * @param session_id session的id
   * @param item_id 项标识符
   * @param metric_type 指标类型可选值 request | investigation
   */
    CounterCollector.collect = function (user_id, session_id, item_id, title_id, platform_id, metric_type) {
        this[counterStorage].insert(user_id, session_id, item_id, title_id, platform_id, metric_type);
    };
    /**
     *  上传数据
     */
    CounterCollector.upload = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var data = _this[counterStorage].toArray();
            index_1.uploadData(data).then(function (res) {
                console.log(res);
                // 上传成功后清空本地存储
                _this[counterStorage].clear();
                resolve('success');
            })["catch"](function (err) {
                reject(err);
            });
        });
    };
    // 测试用例
    CounterCollector.test = function () {
        test_1["default"]();
    };
    return CounterCollector;
}());
exports["default"] = CounterCollector;
