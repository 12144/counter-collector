/**
 * 此对象的功能有
 * 1.初始化本读存储对象单例
 * 2.采集数据存储至本地存储对象中
 * 3.定时批量将本地存储数据上传至服务器
 */
import CounterStorage, { MetricType, UploadData } from "./CounterStorage"
import { uploadData, getUserIP } from "./request/index"
import Test from "./counterTest/index"

const counterStorage = Symbol("counterStorage")
const counterInterval = Symbol("counterInterval")

export default class CounterCollector {
    static [counterStorage]: CounterStorage;
    static [counterInterval]: NodeJS.Timeout;
    /**
   * 初始化，在window上挂载一个单例作为本地存储
   * @param interval 采集间隔，单位ms，默认是10分钟
   */
    static init(interval: number = 1000*60*10): void {
      if(!CounterCollector[counterStorage]){
        CounterCollector[counterStorage] = new CounterStorage()
      }

      if(!CounterCollector[counterInterval]) {
        CounterCollector[counterInterval] = setInterval(function(){
          CounterCollector.upload()
        }, interval)
      }
    }

    static async getUserId(user_id?:string, ip?: string): Promise<string>{
      if(user_id) return user_id;
      if(!ip) {
        const result = await getUserIP()
        ip = result.data
      }
      return JSON.stringify({
        ip,
        userAgent: navigator.userAgent,
      });
    }

    static async getSessionId(session_id?:string, user_id?: string, cookie_id?:string, ip?:string): Promise<string>{
      if(session_id) return session_id
      const now = new Date()
      let identifier = user_id || cookie_id || `${ip}|${navigator.userAgent}`
      if(!identifier){
        const result = await getUserIP()
        identifier = `${result.data}|${navigator.userAgent}`
      }
      return `${identifier}|${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}|${now.getHours()}`
    }

    /**
   * 采集有效的数据
   * 标识符规则见counter标准https://www.projectcounter.org/code-of-practice-five-sections/7-processing-rules-underlying-counter-reporting-data/
   * @param user_id 用户标识符
   * @param session_id session的id
   * @param item_id 项标识符
   * @param metric_type 指标类型可选值 request | investigation
   */
    static collect(user_id: string, session_id:string, item_id: string, title_id:string, platform_id: string, metric_type: MetricType): void {
      this[counterStorage].insert(user_id, session_id, item_id, title_id, platform_id, metric_type)
    }

    /**
     *  上传数据
     */
    static upload(): Promise<any>{
      return new Promise((resolve, reject) => {
        const data: UploadData[] = this[counterStorage].toArray()
  
        uploadData(data).then(res => {
          // 上传成功后清空本地存储
          this[counterStorage].clear()
          resolve('success')
        }).catch(err => {
          reject(err)
        })
      })
    }

    // 测试用例
    static async test(): Promise<void> {
      await Test()
    }
}