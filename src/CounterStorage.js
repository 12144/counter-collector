"use strict";
/**
 * 本地存储数据结构
 * key是一个组合用户标识符和项标识符的字符串，标识哪个用户点击了哪个项
 * value结构如MapValue所示，count计数，lastTime是时间戳记录同一个用户点击同一项最近的时间
 * 如果新的请求与上一次请求的时间不超过30s，那么count不增加（双击过滤规则），如果超过则增加count，更新lastTime
*/
exports.__esModule = true;
exports.MetricType = void 0;
var MetricType;
(function (MetricType) {
    MetricType["REQUEST"] = "request";
    MetricType["INVESTIGATION"] = "investigation";
    MetricType["NO_LICENSE"] = "no_license";
    MetricType["LIMIT_EXCEEDED"] = "limit_exceeded";
})(MetricType = exports.MetricType || (exports.MetricType = {}));
var CounterStorage = /** @class */ (function () {
    function CounterStorage() {
        this.itemMap = new Map();
        this.titleMap = new Map();
        this.platformMap = new Map();
    }
    CounterStorage.prototype.generateKey = function (user_id, session_id) {
        return JSON.stringify({
            user_id: user_id,
            session_id: session_id
        });
    };
    // 插入新的记录
    CounterStorage.prototype.insert = function (user_id, session_id, item_id, title_id, platform_id, metricType) {
        var itemMap = this.itemMap;
        var titleMap = this.titleMap;
        var platformMap = this.platformMap;
        var key = this.generateKey(user_id, session_id);
        var itemRecord = this.getItemRecord(item_id, title_id);
        var titleRecord = this.getTitleRecord(title_id);
        var platformRecord = this.getPlatformRecord(platform_id);
        if (metricType === MetricType.REQUEST) {
            this.dealRequest(itemRecord, titleRecord, platformRecord, key);
        }
        else if (metricType === MetricType.INVESTIGATION) {
            this.dealInvestigation(itemRecord, titleRecord, platformRecord, key);
        }
        else if (metricType === MetricType.NO_LICENSE) {
            this.dealNoLicense(itemRecord, titleRecord, platformRecord, key);
        }
        else if (metricType === MetricType.LIMIT_EXCEEDED) {
            this.dealLimitExceeded(itemRecord, titleRecord, platformRecord, key);
        }
        itemMap.set(item_id, itemRecord);
        titleMap.set(title_id, titleRecord);
        platformMap.set(platform_id, platformRecord);
    };
    CounterStorage.prototype.getItemRecord = function (item_id, title_id) {
        return this.itemMap.get(item_id) || {
            title_id: title_id,
            // metric
            unique_item_requests: 0,
            total_item_requests: 0,
            unique_item_investigations: 0,
            total_item_investigations: 0,
            no_license: 0,
            limit_exceeded: 0,
            // 用于double-click
            map: {
                requests: new Map(),
                investigations: new Map(),
                no_license: new Map(),
                limit_exceeded: new Map()
            }
        };
    };
    CounterStorage.prototype.getTitleRecord = function (title_id) {
        return this.titleMap.get(title_id) || {
            unique_item_requests: 0,
            total_item_requests: 0,
            unique_item_investigations: 0,
            total_item_investigations: 0,
            no_license: 0,
            limit_exceeded: 0,
            unique_title_requests: 0,
            unique_title_investigations: 0,
            // unique
            map: {
                requests: new Set(),
                investigations: new Set()
            }
        };
    };
    CounterStorage.prototype.getPlatformRecord = function (platform_id) {
        return this.platformMap.get(platform_id) || {
            unique_item_requests: 0,
            total_item_requests: 0,
            unique_item_investigations: 0,
            total_item_investigations: 0,
            no_license: 0,
            limit_exceeded: 0,
            unique_title_requests: 0,
            unique_title_investigations: 0
        };
    };
    CounterStorage.prototype.dealRequest = function (itemRecord, titleRecord, platformRecord, key) {
        var now = new Date().getTime();
        var last_time = itemRecord.map.requests.get(key);
        if (last_time) {
            if (now - last_time > 30000) {
                itemRecord.total_item_requests++;
                titleRecord.total_item_requests++;
                platformRecord.total_item_requests++;
            }
        }
        else {
            itemRecord.total_item_requests++;
            titleRecord.total_item_requests++;
            platformRecord.total_item_requests++;
            itemRecord.unique_item_requests++;
            titleRecord.unique_item_requests++;
            platformRecord.unique_item_requests;
            if (titleRecord.map.requests.has(key) === false) {
                titleRecord.unique_title_requests++;
                platformRecord.unique_title_requests++;
                titleRecord.map.requests.add(key);
            }
        }
        itemRecord.map.requests.set(key, now);
        this.dealInvestigation(itemRecord, titleRecord, platformRecord, key);
    };
    CounterStorage.prototype.dealInvestigation = function (itemRecord, titleRecord, platformRecord, key) {
        var now = new Date().getTime();
        var last_time = itemRecord.map.investigations.get(key);
        if (last_time) {
            if (now - last_time > 30000) {
                itemRecord.total_item_investigations++;
                titleRecord.total_item_investigations++;
                platformRecord.total_item_investigations++;
            }
        }
        else {
            itemRecord.total_item_investigations++;
            titleRecord.total_item_investigations++;
            platformRecord.total_item_investigations++;
            itemRecord.unique_item_investigations++;
            titleRecord.unique_item_investigations++;
            platformRecord.unique_item_investigations++;
            if (titleRecord.map.investigations.has(key) === false) {
                titleRecord.unique_title_investigations++;
                platformRecord.unique_title_investigations++;
                titleRecord.map.investigations.add(key);
            }
        }
        itemRecord.map.investigations.set(key, now);
    };
    CounterStorage.prototype.dealNoLicense = function (itemRecord, titleRecord, platformRecord, key) {
        var now = new Date().getTime();
        var last_time = itemRecord.map.no_license.get(key);
        if (!last_time || now - last_time > 30000) {
            itemRecord.no_license++;
            titleRecord.no_license++;
            platformRecord.no_license++;
        }
        itemRecord.map.no_license.set(key, now);
    };
    CounterStorage.prototype.dealLimitExceeded = function (itemRecord, titleRecord, platformRecord, key) {
        var now = new Date().getTime();
        var last_time = itemRecord.map.limit_exceeded.get(key);
        if (!last_time || now - last_time > 30000) {
            itemRecord.limit_exceeded++;
            titleRecord.limit_exceeded++;
            platformRecord.limit_exceeded++;
        }
        itemRecord.map.limit_exceeded.set(key, now);
    };
    // 清空记录
    CounterStorage.prototype.clear = function () {
        this.itemMap.clear();
        this.titleMap.clear();
        this.platformMap.clear();
    };
    CounterStorage.prototype.toArray = function () {
        var data = [];
        this.itemMap.forEach(function (value, key) {
            data.push({
                item_id: key,
                title_id: value.title_id,
                unique_item_requests: value.unique_item_requests,
                total_item_requests: value.total_item_requests,
                unique_item_investigations: value.unique_item_investigations,
                total_item_investigations: value.total_item_investigations,
                no_license: value.no_license,
                limit_exceeded: value.limit_exceeded
            });
        });
        this.titleMap.forEach(function (value, key) {
            data.push({
                title_id: key,
                unique_item_requests: value.unique_item_requests,
                total_item_requests: value.total_item_requests,
                unique_item_investigations: value.unique_item_investigations,
                total_item_investigations: value.total_item_investigations,
                no_license: value.no_license,
                limit_exceeded: value.limit_exceeded,
                unique_title_requests: value.unique_title_requests,
                unique_title_investigations: value.unique_title_investigations
            });
        });
        this.platformMap.forEach(function (value, key) {
            data.push({
                platform_id: key,
                unique_item_requests: value.unique_item_requests,
                total_item_requests: value.total_item_requests,
                unique_item_investigations: value.unique_item_investigations,
                total_item_investigations: value.total_item_investigations,
                no_license: value.no_license,
                limit_exceeded: value.limit_exceeded,
                unique_title_requests: value.unique_title_requests,
                unique_title_investigations: value.unique_title_investigations
            });
        });
        return data;
    };
    return CounterStorage;
}());
exports["default"] = CounterStorage;
