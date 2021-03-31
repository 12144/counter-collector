/** 
 * 本地存储数据结构 
 * key是一个组合用户标识符和项标识符的字符串，标识哪个用户点击了哪个项
 * value结构如MapValue所示，count计数，lastTime是时间戳记录同一个用户点击同一项最近的时间
 * 如果新的请求与上一次请求的时间不超过30s，那么count不增加（双击过滤规则），如果超过则增加count，更新lastTime
*/

// 测试的时候可以为减少时间可以写短一点，推荐3s
export const DoubleClickInternal = 30000

interface ItemMapValue {
  title_id: string;
  // metric
  unique_item_requests: number; 
  total_item_requests: number; 
  unique_item_investigations: number;
  total_item_investigations: number;
  no_license: number;
  limit_exceeded: number;
  /** 用于double-click
   * number是上一次对某item进行操作的时间，map里有无记录来判断unique指标
   * */ 
  map:{
    requests: Map<string, number>;
    investigations: Map<string, number>;
    no_license: Map<string, number>;
    limit_exceeded: Map<string, number>;
  }
}

interface TitleMapValue {
  // metric
  unique_item_requests: number; 
  total_item_requests: number; 
  unique_item_investigations: number;
  total_item_investigations: number;
  no_license: number;
  limit_exceeded: number;
  unique_title_requests: number;
  unique_title_investigations: number;
  // unique
  map: {
    requests: Set<string>;
    investigations: Set<string>;
  }
}

interface PlatformMapValue {
  // metric
  unique_item_requests: number; 
  total_item_requests: number; 
  unique_item_investigations: number;
  total_item_investigations: number;
  no_license: number;
  limit_exceeded: number;
  unique_title_requests: number;
  unique_title_investigations: number;
}

export interface UploadData {
  item_id?: string,
  title_id?: string;
  platform_id?:string;
  unique_item_requests: number; 
  total_item_requests: number; 
  unique_item_investigations: number;
  total_item_investigations: number;
  no_license: number;
  limit_exceeded: number;
  unique_title_requests?: number;
  unique_title_investigations?: number;
}

export enum MetricType {
  REQUEST = 'request',
  INVESTIGATION = 'investigation',
  NO_LICENSE = 'no_license',
  LIMIT_EXCEEDED = 'limit_exceeded'
}

export default class CounterStorage {
    itemMap: Map<string,ItemMapValue>;
    titleMap: Map<string, TitleMapValue>;
    platformMap: Map<string, PlatformMapValue>;

    constructor() {
      this.itemMap = new Map()
      this.titleMap = new Map()
      this.platformMap = new Map()
    }

    generateKey(user_id: string, session_id: string): string{
      return JSON.stringify({
        user_id,
        session_id,
      })
    }
    
    // 插入新的记录
    insert(user_id: string, session_id: string, item_id: string, title_id: string, platform_id:string, metricType: MetricType):void {
      const itemMap = this.itemMap
      const titleMap = this.titleMap
      const platformMap = this.platformMap
      const key = this.generateKey(user_id,session_id)

      const itemRecord: ItemMapValue = this.getItemRecord(item_id, title_id);
      const titleRecord: TitleMapValue = this.getTitleRecord(title_id)
      const platformRecord: PlatformMapValue = this.getPlatformRecord(platform_id)

      if(metricType === MetricType.REQUEST) {
        this.dealRequest(itemRecord, titleRecord, platformRecord, key)
      }else if(metricType === MetricType.INVESTIGATION) {
        this.dealInvestigation(itemRecord, titleRecord, platformRecord, key)
      }else if(metricType === MetricType.NO_LICENSE) {
        this.dealNoLicense(itemRecord, titleRecord, platformRecord, key)
      }else if(metricType === MetricType.LIMIT_EXCEEDED) {
        this.dealLimitExceeded(itemRecord, titleRecord, platformRecord, key)
      }
      
      itemMap.set(item_id, itemRecord)
      titleMap.set(title_id, titleRecord)
      platformMap.set(platform_id, platformRecord)
    }

    getItemRecord(item_id: string, title_id: string): ItemMapValue{
      return this.itemMap.get(item_id) || {
        title_id,
        // metric
        unique_item_requests: 0,
        total_item_requests: 0, 
        unique_item_investigations: 0,
        total_item_investigations: 0,
        no_license: 0,
        limit_exceeded: 0,
        // 用于double-click
        map:{
          requests: new Map(),
          investigations: new Map(),
          no_license: new Map(),
          limit_exceeded: new Map()
        }
      }
    }

    getTitleRecord(title_id: string): TitleMapValue{
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
      }
    }

    getPlatformRecord(platform_id: string): PlatformMapValue {
      return this.platformMap.get(platform_id) || {
        unique_item_requests: 0, 
        total_item_requests: 0, 
        unique_item_investigations: 0,
        total_item_investigations: 0,
        no_license: 0,
        limit_exceeded: 0,
        unique_title_requests: 0,
        unique_title_investigations: 0,
      }
    }

    dealRequest(itemRecord: ItemMapValue, titleRecord: TitleMapValue, platformRecord: PlatformMapValue, key: string):void {
      const now = new Date().getTime();
      const last_time = itemRecord.map.requests.get(key)
      let ignoreLastTime = false

      if(last_time) {
        if(now - last_time > DoubleClickInternal) {
          ignoreLastTime = true
          itemRecord.total_item_requests++
          titleRecord.total_item_requests++
          platformRecord.total_item_requests++
        }
      }else {
        ignoreLastTime = true
        itemRecord.total_item_requests++
        titleRecord.total_item_requests++
        platformRecord.total_item_requests++
        itemRecord.unique_item_requests++
        titleRecord.unique_item_requests++
        platformRecord.unique_item_requests++
        if(titleRecord.map.requests.has(key) === false){
          titleRecord.unique_title_requests++
          platformRecord.unique_title_requests++
          titleRecord.map.requests.add(key)
        } 
      }

      itemRecord.map.requests.set(key, now)
      this.dealInvestigation(itemRecord, titleRecord, platformRecord, key, ignoreLastTime)
    }

    dealInvestigation(itemRecord: ItemMapValue, titleRecord: TitleMapValue, platformRecord: PlatformMapValue, key: string, ignoreLastTime?: boolean):void {
      const now = new Date().getTime()
      const last_time = itemRecord.map.investigations.get(key)

      if(last_time) {
        if(ignoreLastTime || now - last_time > DoubleClickInternal) {
          itemRecord.total_item_investigations++
          titleRecord.total_item_investigations++
          platformRecord.total_item_investigations++
        }
      }else {
        itemRecord.total_item_investigations++
        titleRecord.total_item_investigations++
        platformRecord.total_item_investigations++
        itemRecord.unique_item_investigations++
        titleRecord.unique_item_investigations++
        platformRecord.unique_item_investigations++
        if(titleRecord.map.investigations.has(key) === false) {
          titleRecord.unique_title_investigations++
          platformRecord.unique_title_investigations++
          titleRecord.map.investigations.add(key)
        }
      }
      itemRecord.map.investigations.set(key, now)
    }

    dealNoLicense(itemRecord: ItemMapValue, titleRecord: TitleMapValue, platformRecord: PlatformMapValue, key: string):void {
      const now = new Date().getTime()
      const last_time = itemRecord.map.no_license.get(key)

      if(!last_time || now - last_time > DoubleClickInternal) {
        itemRecord.no_license++
        titleRecord.no_license++
        platformRecord.no_license++
      }
      itemRecord.map.no_license.set(key, now)
    }

    dealLimitExceeded(itemRecord: ItemMapValue, titleRecord: TitleMapValue, platformRecord: PlatformMapValue, key: string):void {
      const now = new Date().getTime()
      const last_time = itemRecord.map.limit_exceeded.get(key)

      if(!last_time || now - last_time > DoubleClickInternal) {
        itemRecord.limit_exceeded++
        titleRecord.limit_exceeded++
        platformRecord.limit_exceeded++
      }
      itemRecord.map.limit_exceeded.set(key, now)
    }

    // 只清理指标数据，保留记录unique指标的map
    clear():void {
      this.itemMap.forEach((value, key)=>{
        value.unique_item_requests = 0
        value.total_item_requests = 0
        value.unique_item_investigations= 0
        value.total_item_investigations= 0
        value.no_license= 0
        value.limit_exceeded= 0
      })
      this.titleMap.forEach((value)=>{
        value.unique_item_requests = 0
        value.total_item_requests = 0
        value.unique_item_investigations = 0
        value.total_item_investigations = 0
        value.no_license = 0
        value.limit_exceeded = 0
        value.unique_title_requests = 0
        value.unique_title_investigations = 0
      })
      this.platformMap.clear()
    }

    clearAll(): void{
      this.itemMap.clear()
      this.titleMap.clear()
      this.platformMap.clear()
    }

    toArray(): UploadData[]{
      const data: UploadData[] = []

      function isEmpty(value: any) {
        return Boolean(
          value.total_item_requests||
          value.unique_item_requests||
          value.total_item_investigations||
          value.unique_item_investigations||
          value.unique_title_requests||
          value.unique_title_investigations||
          value.no_license ||
          value.limit_exceeded)
      }
      this.itemMap.forEach((value: ItemMapValue, key: string)=>{
        if(isEmpty(value)){
          data.push({ 
            item_id: key,
            title_id: value.title_id,
            unique_item_requests: value.unique_item_requests, 
            total_item_requests: value.total_item_requests, 
            unique_item_investigations: value.unique_item_investigations,
            total_item_investigations: value.total_item_investigations,
            no_license: value.no_license,
            limit_exceeded: value.limit_exceeded,
          })
        }
      })

      this.titleMap.forEach((value: TitleMapValue, key: string)=>{
        if(isEmpty(value)){
          data.push({ 
            title_id: key,
            unique_item_requests: value.unique_item_requests, 
            total_item_requests: value.total_item_requests, 
            unique_item_investigations: value.unique_item_investigations,
            total_item_investigations: value.total_item_investigations,
            no_license: value.no_license,
            limit_exceeded: value.limit_exceeded,
            unique_title_requests: value.unique_title_requests,
            unique_title_investigations: value.unique_title_investigations,
          })
        }
      })

      this.platformMap.forEach((value: PlatformMapValue, key:string)=>{
        if(isEmpty(value)){
          data.push({
            platform_id:key,
            unique_item_requests: value.unique_item_requests, 
            total_item_requests: value.total_item_requests, 
            unique_item_investigations: value.unique_item_investigations,
            total_item_investigations: value.total_item_investigations,
            no_license: value.no_license,
            limit_exceeded: value.limit_exceeded,
            unique_title_requests: value.unique_title_requests,
            unique_title_investigations: value.unique_title_investigations,
          })
        }
      })
      return data
    }
}