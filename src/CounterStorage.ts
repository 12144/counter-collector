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

export enum MetricType {
  REQUEST = 'request',
  INVESTIGATION = 'investigation',
  NO_LICENSE = 'no_license',
  LIMIT_EXCEEDED = 'limit_exceeded'
}

export default class CounterStorage {
    map: Map<string,MapValue>;

    constructor() {
      this.map = new Map()
    }

    // 插入新的记录
    insert(user: string, item: string, parentId: string, metricType: MetricType):void {
      const map = this.map
      const key = `${user}$$${item}`;

      let record: MapValue = map.get(key) || {
        parent_id: parentId,
        requests: 0,
        investigations: 0,
        no_license: 0,
        limit_exceeded: 0,
        requests_last_time: 0,
        investigations_last_time: 0,
        no_license_last_time: 0,
        limit_exceeded_last_time: 0
      }

      if(metricType === MetricType.REQUEST) {
        record = this.dealRequest(record)
      }else if(metricType === MetricType.INVESTIGATION) {
        record = this.dealInvestigation(record)
      }else if(metricType === MetricType.NO_LICENSE) {
        record = this.dealNoLicense(record)
      }else if(metricType === MetricType.LIMIT_EXCEEDED) {
        record = this.dealLimitExceeded(record)
      }
      
      map.set(key, record)
    }

    dealRequest(record: MapValue):MapValue {
      const now = new Date().getTime()

      if(now - record.requests_last_time > 30000) {
        record.requests++;
        record.requests_last_time = now
      }

      return this.dealInvestigation(record)
    }

    dealInvestigation(record: MapValue):MapValue {
      const now = new Date().getTime()

      if(now - record.investigations_last_time > 30000) {
        record.investigations++;
        record.investigations_last_time = now
      }

      return record
    }

    dealNoLicense(record: MapValue):MapValue {
      const now = new Date().getTime()

      if(now - record.no_license_last_time > 30000) {
        record.no_license++;
        record.no_license_last_time = now;
      }

      return record
    }

    dealLimitExceeded(record: MapValue):MapValue {
      const now = new Date().getTime()

      if(now - record.limit_exceeded_last_time > 30000) {
        record.limit_exceeded++;
        record.limit_exceeded_last_time = now;
      }

      return record
    }

    // 清空记录
    clear():void {
      this.map.clear()
    }

    forEach(callbackfn: (value: MapValue, key: string) => void):void {
      return this.map.forEach(callbackfn);
    }
}