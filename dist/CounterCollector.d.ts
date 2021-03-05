/// <reference types="node" />
/**
 * 此对象的功能有
 * 1.初始化本读存储对象单例
 * 2.采集数据存储至本地存储对象中
 * 3.定时批量将本地存储数据上传至服务器
 */
import CounterStorage, { MetricType } from "./CounterStorage";
declare const counterStorage: unique symbol;
declare const counterInterval: unique symbol;
export default class CounterCollector {
    static [counterStorage]: CounterStorage;
    static [counterInterval]: NodeJS.Timeout;
    /**
   * 初始化，在window上挂载一个单例作为本地存储
   * @param interval 采集间隔，单位ms，默认是10分钟
   */
    static init(interval?: number): void;
    /**
   * 采集有效的数据
   * 标识符规则见counter标准https://www.projectcounter.org/code-of-practice-five-sections/7-processing-rules-underlying-counter-reporting-data/
   * @param user_identifier 用户标识符
   * @param item_identifier 项标识符
   * @param metric_type 指标类型可选值 request | investigation
   */
    static collect(userIdentifier: string, itemIdentifier: string, parentIdentifier: string, metricType: MetricType): void;
    /**
     *  上传数据
     */
    static upload(): void;
}
export {};
