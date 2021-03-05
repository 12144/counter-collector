/**
 * 本地存储数据结构
 * key是一个组合用户标识符和项标识符的字符串，标识哪个用户点击了哪个项
 * value结构如MapValue所示，count计数，lastTime是时间戳记录同一个用户点击同一项最近的时间
 * 如果新的请求与上一次请求的时间不超过30s，那么count不增加（双击过滤规则），如果超过则增加count，更新lastTime
*/
interface MapValue {
    parent_id: string;
    requests: number;
    investigations: number;
    no_license: number;
    limit_exceeded: number;
    requests_last_time: number;
    investigations_last_time: number;
    no_license_last_time: number;
    limit_exceeded_last_time: number;
}
export declare enum MetricType {
    REQUEST = "request",
    INVESTIGATION = "investigation",
    NO_LICENSE = "no_license",
    LIMIT_EXCEEDED = "limit_exceeded"
}
export default class CounterStorage {
    map: Map<string, MapValue>;
    constructor();
    insert(user: string, item: string, parentId: string, metricType: MetricType): void;
    dealRequest(record: MapValue): MapValue;
    dealInvestigation(record: MapValue): MapValue;
    dealNoLicense(record: MapValue): MapValue;
    dealLimitExceeded(record: MapValue): MapValue;
    clear(): void;
    forEach(callbackfn: (value: MapValue, key: string) => void): void;
}
export {};
