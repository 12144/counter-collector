"use strict";
/**
 * 本地存储数据结构
 * key是一个组合用户标识符和项标识符的字符串，标识哪个用户点击了哪个项
 * value结构如MapValue所示，count计数，lastTime是时间戳记录同一个用户点击同一项最近的时间
 * 如果新的请求与上一次请求的时间不超过30s，那么count不增加（双击过滤规则），如果超过则增加count，更新lastTime
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricType = void 0;
var MetricType;
(function (MetricType) {
    MetricType["REQUEST"] = "request";
    MetricType["INVESTIGATION"] = "investigation";
    MetricType["NO_LICENSE"] = "no_license";
    MetricType["LIMIT_EXCEEDED"] = "limit_exceeded";
})(MetricType = exports.MetricType || (exports.MetricType = {}));
class CounterStorage {
    constructor() {
        this.map = new Map();
    }
    // 插入新的记录
    insert(user, item, parentId, metricType) {
        const map = this.map;
        const key = `${user}$$${item}`;
        let record = map.get(key) || {
            parent_id: parentId,
            requests: 0,
            investigations: 0,
            no_license: 0,
            limit_exceeded: 0,
            requests_last_time: 0,
            investigations_last_time: 0,
            no_license_last_time: 0,
            limit_exceeded_last_time: 0
        };
        if (metricType === MetricType.REQUEST) {
            record = this.dealRequest(record);
        }
        else if (metricType === MetricType.INVESTIGATION) {
            record = this.dealInvestigation(record);
        }
        else if (metricType === MetricType.NO_LICENSE) {
            record = this.dealNoLicense(record);
        }
        else if (metricType === MetricType.LIMIT_EXCEEDED) {
            record = this.dealLimitExceeded(record);
        }
        map.set(key, record);
    }
    dealRequest(record) {
        const now = new Date().getTime();
        if (now - record.requests_last_time > 30000) {
            record.requests++;
            record.requests_last_time = now;
        }
        return this.dealInvestigation(record);
    }
    dealInvestigation(record) {
        const now = new Date().getTime();
        if (now - record.investigations_last_time > 30000) {
            record.investigations++;
            record.investigations_last_time = now;
        }
        return record;
    }
    dealNoLicense(record) {
        const now = new Date().getTime();
        if (now - record.no_license_last_time > 30000) {
            record.no_license++;
            record.no_license_last_time = now;
        }
        return record;
    }
    dealLimitExceeded(record) {
        const now = new Date().getTime();
        if (now - record.limit_exceeded_last_time > 30000) {
            record.limit_exceeded++;
            record.limit_exceeded_last_time = now;
        }
        return record;
    }
    // 清空记录
    clear() {
        this.map.clear();
    }
    forEach(callbackfn) {
        return this.map.forEach(callbackfn);
    }
}
exports.default = CounterStorage;
