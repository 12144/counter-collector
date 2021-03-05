/**
 * 此对象的功能有
 * 1.初始化本读存储对象单例
 * 2.采集数据存储至本地存储对象中
 * 3.定时批量将本地存储数据上传至服务器
 */
import CounterStorage, { MetricType } from "./CounterStorage"
import { CounterData, uploadData } from "./request/index"

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
        CounterCollector[counterInterval] = setInterval(function(){
          CounterCollector.upload()
        }, interval)
      }
    }

    /**
   * 采集有效的数据
   * 标识符规则见counter标准https://www.projectcounter.org/code-of-practice-five-sections/7-processing-rules-underlying-counter-reporting-data/
   * @param user_identifier 用户标识符
   * @param item_identifier 项标识符
   * @param metric_type 指标类型可选值 request | investigation
   */
    static collect(userIdentifier: string, itemIdentifier: string, parentIdentifier: string, metricType: MetricType): void {
      this[counterStorage].insert(userIdentifier, itemIdentifier, parentIdentifier, metricType)
    }

    /**
     *  上传数据
     */
    static upload(): void{
      const data: CounterData[] = []
      this[counterStorage].forEach((value, key) => {
        const arr = key.split("$$")
        data.push({
          user_id: arr[0],
          item_id: arr[1],
          parent_id: value.parent_id,
          requests: value.requests,
          investigations: value.investigations,
          no_license: value.no_license,
          limit_exceeded: value.limit_exceeded
        })
      })

      uploadData(data).then(res => {
        console.log(res)
        // 上传成功后清空本地存储
        this[counterStorage].clear()
      }).catch(err => {
        console.log(err)
      })
    }
}