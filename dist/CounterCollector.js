"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 此对象的功能有
 * 1.初始化本读存储对象单例
 * 2.采集数据存储至本地存储对象中
 * 3.定时批量将本地存储数据上传至服务器
 */
const CounterStorage_1 = __importDefault(require("./CounterStorage"));
const index_1 = require("./request/index");
const counterStorage = Symbol("counterStorage");
const counterInterval = Symbol("counterInterval");
class CounterCollector {
    /**
   * 初始化，在window上挂载一个单例作为本地存储
   * @param interval 采集间隔，单位ms，默认是10分钟
   */
    static init(interval = 1000 * 60 * 10) {
        if (!CounterCollector[counterStorage]) {
            CounterCollector[counterStorage] = new CounterStorage_1.default();
            CounterCollector[counterInterval] = setInterval(function () {
                CounterCollector.upload();
            }, interval);
        }
    }
    /**
   * 采集有效的数据
   * 标识符规则见counter标准https://www.projectcounter.org/code-of-practice-five-sections/7-processing-rules-underlying-counter-reporting-data/
   * @param user_identifier 用户标识符
   * @param item_identifier 项标识符
   * @param metric_type 指标类型可选值 request | investigation
   */
    static collect(userIdentifier, itemIdentifier, parentIdentifier, metricType) {
        this[counterStorage].insert(userIdentifier, itemIdentifier, parentIdentifier, metricType);
    }
    /**
     *  上传数据
     */
    static upload() {
        const data = [];
        this[counterStorage].forEach((value, key) => {
            const arr = key.split("$$");
            data.push({
                user_id: arr[0],
                item_id: arr[1],
                parent_id: value.parent_id,
                requests: value.requests,
                investigations: value.investigations,
                no_license: value.no_license,
                limit_exceeded: value.limit_exceeded
            });
        });
        index_1.uploadData(data).then(res => {
            console.log(res);
            // 上传成功后清空本地存储
            this[counterStorage].clear();
        }).catch(err => {
            console.log(err);
        });
    }
}
exports.default = CounterCollector;
