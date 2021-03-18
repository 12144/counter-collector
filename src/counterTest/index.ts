import assert from "assert"
import CounterCollector from "../CounterCollector"
import { MetricType } from "../CounterStorage"
import {
  getPreStatus,
  getPostStatus
} from "./util"

export default async function Test (): Promise<any>{
  CounterCollector.init()

  const now = new Date()
  const month = `${now.getFullYear()}-${now.getMonth() + 1}-01`;

  await testInvestigation(month)
  await testUniqueInvestigation(month)
  await testRequests(month)
  await testUniqueRequests(month)
  await testNoLicense(month)
  await testDoubleClickNoLicense(month)
  await testLimitExceeded(month)
  await testDoubleClickLimitExceeded(month)
}

// 测试访问一个platform1 -> title1-2 -> item1-2-1，指标是否能够正常写入数据库
async function testInvestigation(month: string) {
  // 访问前的状态
  const {preItemMetric,preTitleMetric,prePlatformMetric } = await getPreStatus('7038','8695', '1', month)
  // 访问了item1-2-1
  CounterCollector.collect(await CounterCollector.getUserId(), await CounterCollector.getSessionId(), '7038','8695', '1', MetricType.INVESTIGATION)
  await CounterCollector.upload()
  // 访问后的状态
  const {postItemMetric,postTitleMetric,postPlatformMetric } = await getPostStatus('7038','8695', '1', month)

  preItemMetric.total_item_investigations++
  preItemMetric.unique_item_investigations++

  preTitleMetric.total_item_investigations++
  preTitleMetric.unique_item_investigations++
  preTitleMetric.unique_title_investigations++

  prePlatformMetric.total_item_investigations++
  prePlatformMetric.unique_item_investigations++
  prePlatformMetric.unique_title_investigations++

  assert.deepStrictEqual(postItemMetric, preItemMetric)
  assert.deepStrictEqual(postTitleMetric, preTitleMetric)
  assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
  console.log('测试访问一个item通过')
}

// 测试访问一个platform1 -> title1-2 -> item1-2-1两次， unique指标不应重复计数， total指标重复计数
async function testUniqueInvestigation(month: string) {
  // 访问前的状态
  const {preItemMetric,preTitleMetric,prePlatformMetric } = await getPreStatus('7038','8695', '1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问了item1-2-1
  CounterCollector.collect(user_id, session_id, '7038','8695', '1', MetricType.INVESTIGATION)
  CounterCollector.collect(user_id, session_id, '7038','8695', '1', MetricType.INVESTIGATION)
  await CounterCollector.upload()
  // 访问后的状态
  const {postItemMetric,postTitleMetric,postPlatformMetric } = await getPostStatus('7038','8695', '1', month)

  preItemMetric.total_item_investigations++
  preItemMetric.unique_item_investigations++

  preTitleMetric.total_item_investigations++
  preTitleMetric.unique_item_investigations++
  preTitleMetric.unique_title_investigations++

  prePlatformMetric.total_item_investigations++
  prePlatformMetric.unique_item_investigations++
  prePlatformMetric.unique_title_investigations++

  assert.deepStrictEqual(postItemMetric, preItemMetric)
  assert.deepStrictEqual(postTitleMetric, preTitleMetric)
  assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
  console.log('测试短时间内访问一个item两次通过')
}

// 测试下载一个platform1 -> title1-2 -> item1-2-1，requets和investigations指标都应该计数
async function testRequests(month: string) {
  // 访问前的状态
  const {preItemMetric,preTitleMetric,prePlatformMetric } = await getPreStatus('7038','8695', '1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问了item1-2-1
  CounterCollector.collect(user_id, session_id, '7038','8695', '1', MetricType.REQUEST)
  await CounterCollector.upload()
  // 访问后的状态
  const {postItemMetric,postTitleMetric,postPlatformMetric } = await getPostStatus('7038','8695', '1', month)

  preItemMetric.total_item_investigations++
  preItemMetric.total_item_requests++
  preItemMetric.unique_item_investigations++
  preItemMetric.unique_item_requests++

  preTitleMetric.total_item_investigations++
  preTitleMetric.unique_item_investigations++
  preTitleMetric.unique_title_investigations++
  preTitleMetric.total_item_requests++
  preTitleMetric.unique_item_requests++
  preTitleMetric.unique_title_requests++

  prePlatformMetric.total_item_investigations++
  prePlatformMetric.unique_item_investigations++
  prePlatformMetric.unique_title_investigations++
  prePlatformMetric.total_item_requests++
  prePlatformMetric.unique_item_requests++
  prePlatformMetric.unique_title_requests++

  assert.deepStrictEqual(postItemMetric, preItemMetric)
  assert.deepStrictEqual(postTitleMetric, preTitleMetric)
  assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
  console.log("测试下载一个item通过")
}

// 测试下载一个platform1 -> title1-2 -> item1-2-1两次，requets和investigations指标都应该计数，unique指标不重复计数,total指标重复计数
async function testUniqueRequests(month: string) {
  // 访问前的状态
  const {preItemMetric,preTitleMetric,prePlatformMetric } = await getPreStatus('7038','8695', '1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问了item1-2-1
  CounterCollector.collect(user_id, session_id, '7038','8695', '1', MetricType.REQUEST)
  CounterCollector.collect(user_id, session_id, '7038','8695', '1', MetricType.REQUEST)

  await CounterCollector.upload()
  // 访问后的状态
  const {postItemMetric,postTitleMetric,postPlatformMetric } = await getPostStatus('7038','8695', '1', month)

  preItemMetric.total_item_investigations++
  preItemMetric.total_item_requests++
  preItemMetric.unique_item_investigations++
  preItemMetric.unique_item_requests++

  preTitleMetric.total_item_investigations++
  preTitleMetric.unique_item_investigations++
  preTitleMetric.unique_title_investigations++
  preTitleMetric.total_item_requests++
  preTitleMetric.unique_item_requests++
  preTitleMetric.unique_title_requests++

  prePlatformMetric.total_item_investigations++
  prePlatformMetric.unique_item_investigations++
  prePlatformMetric.unique_title_investigations++
  prePlatformMetric.total_item_requests++
  prePlatformMetric.unique_item_requests++
  prePlatformMetric.unique_title_requests++

  assert.deepStrictEqual(postItemMetric, preItemMetric)
  assert.deepStrictEqual(postTitleMetric, preTitleMetric)
  assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
  console.log("测试短时间内下载一个item两次通过")
}

// 测试no_license platform1 -> title1-2 -> item1-2-1
async function testNoLicense(month: string) {
  const {preItemMetric,preTitleMetric,prePlatformMetric } = await getPreStatus('7038','8695', '1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问了item1-2-1
  CounterCollector.collect(user_id, session_id, '7038','8695', '1', MetricType.NO_LICENSE)

  await CounterCollector.upload()
  // 访问后的状态
  const {postItemMetric,postTitleMetric,postPlatformMetric } = await getPostStatus('7038','8695', '1', month)

  preItemMetric.no_license++
  preTitleMetric.no_license++
  prePlatformMetric.no_license++

  assert.deepStrictEqual(postItemMetric, preItemMetric)
  assert.deepStrictEqual(postTitleMetric, preTitleMetric)
  assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
  console.log("测试no_license通过")
}

// 测试no_license platform1 -> title1-2 -> item1-2-1两次
async function testDoubleClickNoLicense(month:string) {
  const {preItemMetric,preTitleMetric,prePlatformMetric } = await getPreStatus('7038','8695', '1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问了item1-2-1
  CounterCollector.collect(user_id, session_id, '7038','8695', '1', MetricType.NO_LICENSE)
  CounterCollector.collect(user_id, session_id, '7038','8695', '1', MetricType.NO_LICENSE)

  await CounterCollector.upload()
  // 访问后的状态
  const {postItemMetric,postTitleMetric,postPlatformMetric } = await getPostStatus('7038','8695', '1', month)

  preItemMetric.no_license++
  preTitleMetric.no_license++
  prePlatformMetric.no_license++

  assert.deepStrictEqual(postItemMetric, preItemMetric)
  assert.deepStrictEqual(postTitleMetric, preTitleMetric)
  assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
  console.log("测试短时间内no_license两次通过")
}

// 测试limit_exceeded platform1 -> title1-2 -> item1-2-1
async function testLimitExceeded(month:string) {
  const {preItemMetric,preTitleMetric,prePlatformMetric } = await getPreStatus('7038','8695', '1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问了item1-2-1
  CounterCollector.collect(user_id, session_id, '7038','8695', '1', MetricType.LIMIT_EXCEEDED)

  await CounterCollector.upload()
  // 访问后的状态
  const {postItemMetric,postTitleMetric,postPlatformMetric } = await getPostStatus('7038','8695', '1', month)

  preItemMetric.limit_exceeded++
  preTitleMetric.limit_exceeded++
  prePlatformMetric.limit_exceeded++

  assert.deepStrictEqual(postItemMetric, preItemMetric)
  assert.deepStrictEqual(postTitleMetric, preTitleMetric)
  assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
  console.log("测试超出限额通过")
}

// 测试limit_exceeded platform1 -> title1-2 -> item1-2-1两次
async function testDoubleClickLimitExceeded(month:string) {
  const {preItemMetric,preTitleMetric,prePlatformMetric } = await getPreStatus('7038','8695', '1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问了item1-2-1
  CounterCollector.collect(user_id, session_id, '7038','8695', '1', MetricType.LIMIT_EXCEEDED)
  CounterCollector.collect(user_id, session_id, '7038','8695', '1', MetricType.LIMIT_EXCEEDED)

  await CounterCollector.upload()
  // 访问后的状态
  const {postItemMetric,postTitleMetric,postPlatformMetric } = await getPostStatus('7038','8695', '1', month)

  preItemMetric.limit_exceeded++
  preTitleMetric.limit_exceeded++
  prePlatformMetric.limit_exceeded++

  assert.deepStrictEqual(postItemMetric, preItemMetric)
  assert.deepStrictEqual(postTitleMetric, preTitleMetric)
  assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
  console.log("测试短时间内超出限额两次通过")
}
// 测试访问两个不同的item




