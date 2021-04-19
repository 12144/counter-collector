// 本地存储
import {MetricType} from './CounterCollector'

export const Config = { DoubleClickInternal : 30000 }

/** MapValue 
 * 分为两个部分：指标信息和用于记录unique行为的map
 *  指标信息：unique_item_requests，total_item_requests等
 *  map详细描述见下方
*/

interface ItemMapValue {
  title_id: string;
  unique_item_requests: number; 
  total_item_requests: number; 
  unique_item_investigations: number;
  total_item_investigations: number;
  no_license: number;
  limit_exceeded: number;

  /** 用于double-click和记录unique指标
   * map里分为四个小map分别对应四种指标
   * map的key是用userid和sessionid生成的字符串，可以保证不同用户或者同一个用户在不同session内的行为是独立计数的，符合counter标准
   * number是最近一次对某item进行操作的时间
   * 
   * 逻辑是如果map里没有该记录，则插入记录（key, 当前时间）
   * 如果map里有记录，则比较当前时间与上一次操作的时间差是否大于30s
   * 若大于30s，则该行为有效，更新相关指标，更新最近一次操作的时间
   * 若小于30s，则该行为需要被过滤掉，不更新相关指标，但更新最近一次操作的时间，因为根据counter标准，应该使用最后一次操作来代替前一次操作，防止短时间内连续多次的相同操作
   */ 
  map:{
    requests: Map<string, number>;
    investigations: Map<string, number>;
    no_license: Map<string, number>;
    limit_exceeded: Map<string, number>;
  }
}

interface TitleMapValue {
  unique_item_requests: number; 
  total_item_requests: number; 
  unique_item_investigations: number;
  total_item_investigations: number;
  no_license: number;
  limit_exceeded: number;
  unique_title_requests: number;
  unique_title_investigations: number;
  /**
   * 用于记录unique_title指标
   * map里分为两个小map，实际上是一个集合，集合里元素的值也是用userid和sessionid生成的值，标识该用户在该session内访问了此title
   * 逻辑是如果用户对某个item的行为是有效的，则视为其访问了该item所属的title
   * 如果集合里没有此记录，则更新相关指标
   * 如果集合里有此记录，则不做更新
   */
  map: {
    requests: Set<string>;
    investigations: Set<string>;
  }
}

interface PlatformMapValue {
  unique_item_requests: number; 
  total_item_requests: number; 
  unique_item_investigations: number;
  total_item_investigations: number;
  no_license: number;
  limit_exceeded: number;
  unique_title_requests: number;
  unique_title_investigations: number;
}

interface DatabaseMapValue {
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
  database_id?: string;
  unique_item_requests: number; 
  total_item_requests: number; 
  unique_item_investigations: number;
  total_item_investigations: number;
  no_license: number;
  limit_exceeded: number;
  unique_title_requests?: number;
  unique_title_investigations?: number;
}



export default class CounterStorage {
    /**
     * itemMap, titleMap, platformMap分别记录item级别，title级别, platform级别的指标信息
     */
    itemMap: Map<string,ItemMapValue>;
    titleMap: Map<string, TitleMapValue>;
    platformMap: Map<string, PlatformMapValue>;
    databaseMap: Map<string, DatabaseMapValue>;

    constructor() {
      this.itemMap = new Map()
      this.titleMap = new Map()
      this.platformMap = new Map()
      this.databaseMap = new Map()
    }

    generateKey(user_id: string, session_id: string): string{
      return JSON.stringify({
        user_id,
        session_id,
      })
    }
    
    insert(user_id: string, session_id: string, item_id: string, title_id: string, platform_id:string, database_id: string, metricType: MetricType):void {
      const itemMap = this.itemMap
      const titleMap = this.titleMap
      const platformMap = this.platformMap
      const databaseMap = this.databaseMap
      const key = this.generateKey(user_id,session_id)

      const itemRecord: ItemMapValue = this.getItemRecord(item_id, title_id);
      const titleRecord: TitleMapValue = this.getTitleRecord(title_id)
      const platformRecord: PlatformMapValue = this.getPlatformRecord(platform_id)
      const databaseRecord: DatabaseMapValue = this.getDatabaseRecord(database_id)

      if(metricType === MetricType.REQUEST) {
        this.dealRequest(itemRecord, titleRecord, platformRecord, databaseRecord, key)
      }else if(metricType === MetricType.INVESTIGATION) {
        this.dealInvestigation(itemRecord, titleRecord, platformRecord, databaseRecord, key)
      }else if(metricType === MetricType.NO_LICENSE) {
        this.dealNoLicense(itemRecord, titleRecord, platformRecord, databaseRecord, key)
      }else if(metricType === MetricType.LIMIT_EXCEEDED) {
        this.dealLimitExceeded(itemRecord, titleRecord, platformRecord, databaseRecord, key)
      }
      
      itemMap.set(item_id, itemRecord)
      titleMap.set(title_id, titleRecord)
      platformMap.set(platform_id, platformRecord)
      databaseMap.set(database_id, databaseRecord)
    }

    getItemRecord(item_id: string, title_id: string): ItemMapValue{
      return this.itemMap.get(item_id) || {
        title_id,
        
        unique_item_requests: 0,
        total_item_requests: 0, 
        unique_item_investigations: 0,
        total_item_investigations: 0,
        no_license: 0,
        limit_exceeded: 0,
        
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

    getDatabaseRecord(database_id: string): DatabaseMapValue {
      return this.databaseMap.get(database_id) || {
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

    dealRequest(itemRecord: ItemMapValue, titleRecord: TitleMapValue, platformRecord: PlatformMapValue, databaseRecord: DatabaseMapValue, key: string):void {
      const now = new Date().getTime();
      const last_time = itemRecord.map.requests.get(key)
      let ignoreLastTime = false

      if(last_time) {
        if(now - last_time > Config.DoubleClickInternal) {
          ignoreLastTime = true
          itemRecord.total_item_requests++
          titleRecord.total_item_requests++
          platformRecord.total_item_requests++
          databaseRecord.total_item_requests++
        }
      }else {
        ignoreLastTime = true
        itemRecord.total_item_requests++
        titleRecord.total_item_requests++
        platformRecord.total_item_requests++
        databaseRecord.total_item_requests++

        itemRecord.unique_item_requests++
        titleRecord.unique_item_requests++
        platformRecord.unique_item_requests++
        databaseRecord.unique_item_requests++
        if(titleRecord.map.requests.has(key) === false){
          titleRecord.unique_title_requests++
          platformRecord.unique_title_requests++
          databaseRecord.unique_title_requests++
          titleRecord.map.requests.add(key)
        } 
      }

      itemRecord.map.requests.set(key, now)
      this.dealInvestigation(itemRecord, titleRecord, platformRecord, databaseRecord, key, ignoreLastTime)
    }

    dealInvestigation(itemRecord: ItemMapValue, titleRecord: TitleMapValue, platformRecord: PlatformMapValue, databaseRecord: DatabaseMapValue, key: string, ignoreLastTime?: boolean):void {
      const now = new Date().getTime()
      const last_time = itemRecord.map.investigations.get(key)

      if(last_time) {
        if(ignoreLastTime || now - last_time > Config.DoubleClickInternal) {
          itemRecord.total_item_investigations++
          titleRecord.total_item_investigations++
          platformRecord.total_item_investigations++
          databaseRecord.total_item_investigations++
        }
      }else {
        itemRecord.total_item_investigations++
        titleRecord.total_item_investigations++
        platformRecord.total_item_investigations++
        databaseRecord.total_item_investigations++

        itemRecord.unique_item_investigations++
        titleRecord.unique_item_investigations++
        platformRecord.unique_item_investigations++
        databaseRecord.unique_item_investigations++
        if(titleRecord.map.investigations.has(key) === false) {
          titleRecord.unique_title_investigations++
          platformRecord.unique_title_investigations++
          databaseRecord.unique_title_investigations++
          titleRecord.map.investigations.add(key)
        }
      }
      itemRecord.map.investigations.set(key, now)
    }

    dealNoLicense(itemRecord: ItemMapValue, titleRecord: TitleMapValue, platformRecord: PlatformMapValue,  databaseRecord: DatabaseMapValue, key: string):void {
      const now = new Date().getTime()
      const last_time = itemRecord.map.no_license.get(key)

      if(!last_time || now - last_time > Config.DoubleClickInternal) {
        itemRecord.no_license++
        titleRecord.no_license++
        platformRecord.no_license++
        databaseRecord.no_license++
      }
      itemRecord.map.no_license.set(key, now)
    }

    dealLimitExceeded(itemRecord: ItemMapValue, titleRecord: TitleMapValue, platformRecord: PlatformMapValue,  databaseRecord: DatabaseMapValue, key: string):void {
      const now = new Date().getTime()
      const last_time = itemRecord.map.limit_exceeded.get(key)

      if(!last_time || now - last_time > Config.DoubleClickInternal) {
        itemRecord.limit_exceeded++
        titleRecord.limit_exceeded++
        platformRecord.limit_exceeded++
        databaseRecord.limit_exceeded++
      }
      itemRecord.map.limit_exceeded.set(key, now)
    }

    // 只清理指标数据，保留记录unique指标的map，如果直接清理所有数据，那么同一session内的unique行为会被重复计数
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
      this.databaseMap.clear()
    }

    // 清除所有数据
    clearAll(): void{
      this.itemMap.clear()
      this.titleMap.clear()
      this.platformMap.clear()
    }

    // 转换为后端接收的格式
    toArray(): UploadData[]{
      const data: UploadData[] = []

      function isNotEmpty(value: any) {
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
        if(isNotEmpty(value)){
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
        if(isNotEmpty(value)){
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
        if(isNotEmpty(value)){
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

      this.databaseMap.forEach((value: DatabaseMapValue, key:string)=>{
        if(isNotEmpty(value)){
          data.push({
            database_id:key,
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