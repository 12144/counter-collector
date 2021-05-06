import assert from "assert"
import CounterCollector, { counterStorage, MetricType } from "../CounterCollector"
import {
  getPreStatus,
  getPostStatus,
} from "./util"
import { initTest, clearTest } from "../request"

// 测试时DoubleClickInternal的取值是3s
const LongerDoubleClickInternal = 4000
const UploadInterval = 7*1000

export const TestCase = {
  testInvestigation,
  testUniqueInvestigation,
  testRequests,
  testUniqueRequests,
  testNoLicense,
  testDoubleClickNoLicense,
  testLimitExceeded,
  testDoubleClickLimitExceeded,
  // 以下均为定时上传
  testTimeout,
  testTimeoutContinuousDoubleClickItem,
  testTimeoutNotDoubleClickItem,
  testTimeoutAllOptionItem,
  testTimeoutComplicateOption,
  testDifferentInvestigation,
  testCounterScenario,

  testSearchesDatabase,
  testClear
}

export const defaultTestCase = [
  TestCase.testInvestigation,
  TestCase.testUniqueInvestigation,
  TestCase.testRequests,
  TestCase.testUniqueRequests,
  TestCase.testNoLicense,
  TestCase.testDoubleClickNoLicense,
  TestCase.testLimitExceeded,
  TestCase.testDoubleClickLimitExceeded,
      
  TestCase.testTimeout,
  TestCase.testTimeoutContinuousDoubleClickItem,
  TestCase.testTimeoutNotDoubleClickItem,
  TestCase.testTimeoutAllOptionItem,
  TestCase.testTimeoutComplicateOption,
  TestCase.testDifferentInvestigation,
  TestCase.testCounterScenario,

  TestCase.testSearchesDatabase,
]

export default async function Test (testCases: Array<(month: string)=> Promise<any>>, _clearTest = false): Promise<any>{  
  const now = new Date()
  const month = `${now.getFullYear()}-${now.getMonth() + 1}-01`;
  await initTest()
  
  for(let i=0;i<testCases.length;i++){
    await testCases[i](month)
  }

  console.log('全部测试用例通过!')
  if(_clearTest){
    await clearTest()
  }
}

// 测试访问一个platform1 -> title1-2 -> item1-2-1，指标是否能够正常写入数据库
async function testInvestigation(month: string): Promise<any> {
  CounterCollector.init({baseUrl: CounterCollector.baseURL})
  // 访问前的状态
  const {preItemMetric,preTitleMetric,prePlatformMetric,preDatabaseMetric } = await getPreStatus('test7038','test8695', 'test1', 'database1', month)
  // 访问了item1-2-1
  CounterCollector.collect(
    await CounterCollector.getUserId(),
    await CounterCollector.getSessionId(), 
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)
  
  await CounterCollector.upload()

  preItemMetric.total_item_investigations++
  preItemMetric.unique_item_investigations++

  preTitleMetric.total_item_investigations++
  preTitleMetric.unique_item_investigations++
  preTitleMetric.unique_title_investigations++

  prePlatformMetric.total_item_investigations++
  prePlatformMetric.unique_item_investigations++
  prePlatformMetric.unique_title_investigations++

  preDatabaseMetric.total_item_investigations++
  preDatabaseMetric.unique_item_investigations++
  preDatabaseMetric.unique_title_investigations++

  // 访问后的状态
  const {postItemMetric,postTitleMetric,postPlatformMetric, postDatabaseMetric } = await getPostStatus('test7038','test8695', 'test1', 'database1', month)
  assert.deepStrictEqual(postItemMetric, preItemMetric)
  assert.deepStrictEqual(postTitleMetric, preTitleMetric)
  assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
  assert.deepStrictEqual(postDatabaseMetric, preDatabaseMetric)
  console.log('测试访问一个item通过')
}

// 测试访问一个platform1 -> title1-2 -> item1-2-1两次， unique指标不应重复计数， total指标重复计数
async function testUniqueInvestigation(month: string): Promise<any> {
  CounterCollector.init({baseUrl: CounterCollector.baseURL})
  // 访问前的状态
  const {preItemMetric,preTitleMetric,prePlatformMetric, preDatabaseMetric } = await getPreStatus('test7038','test8695', 'test1', 'database1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问了item1-2-1
  CounterCollector.collect(
    user_id, 
    session_id, 
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)

  CounterCollector.collect(
    user_id, 
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)
  
  await CounterCollector.upload()

  preItemMetric.total_item_investigations++
  preItemMetric.unique_item_investigations++

  preTitleMetric.total_item_investigations++
  preTitleMetric.unique_item_investigations++
  preTitleMetric.unique_title_investigations++

  prePlatformMetric.total_item_investigations++
  prePlatformMetric.unique_item_investigations++
  prePlatformMetric.unique_title_investigations++

  preDatabaseMetric.total_item_investigations++
  preDatabaseMetric.unique_item_investigations++
  preDatabaseMetric.unique_title_investigations++

  // 访问后的状态
  const {postItemMetric,postTitleMetric,postPlatformMetric, postDatabaseMetric } = await getPostStatus('test7038','test8695', 'test1', 'database1', month)
  assert.deepStrictEqual(postItemMetric, preItemMetric)
  assert.deepStrictEqual(postTitleMetric, preTitleMetric)
  assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
  assert.deepStrictEqual(postDatabaseMetric, preDatabaseMetric)
  console.log('测试短时间内访问一个item两次通过')
}

// 测试下载一个platform1 -> title1-2 -> item1-2-1，requets和investigations指标都应该计数
async function testRequests(month: string): Promise<any> {
  CounterCollector.init({baseUrl: CounterCollector.baseURL})
  // 访问前的状态
  const {preItemMetric,preTitleMetric,prePlatformMetric, preDatabaseMetric } = await getPreStatus('test7038','test8695', 'test1', 'database1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问了item1-2-1
  CounterCollector.collect(
    user_id,
    session_id, 
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.REQUEST)

  await CounterCollector.upload()

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

  preDatabaseMetric.total_item_investigations++
  preDatabaseMetric.unique_item_investigations++
  preDatabaseMetric.unique_title_investigations++
  preDatabaseMetric.total_item_requests++
  preDatabaseMetric.unique_item_requests++
  preDatabaseMetric.unique_title_requests++

  // 访问后的状态
  const {postItemMetric,postTitleMetric,postPlatformMetric, postDatabaseMetric } = await getPostStatus('test7038','test8695', 'test1', 'database1', month)
  assert.deepStrictEqual(postItemMetric, preItemMetric)
  assert.deepStrictEqual(postTitleMetric, preTitleMetric)
  assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
  assert.deepStrictEqual(postDatabaseMetric, preDatabaseMetric)
  console.log("测试下载一个item通过")
}

// 测试下载一个platform1 -> title1-2 -> item1-2-1两次，requets和investigations指标都应该计数
async function testUniqueRequests(month: string): Promise<any> {
  CounterCollector.init({baseUrl: CounterCollector.baseURL})
  // 访问前的状态
  const {preItemMetric,preTitleMetric,prePlatformMetric, preDatabaseMetric } = await getPreStatus('test7038','test8695', 'test1', 'database1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问了item1-2-1
  CounterCollector.collect(
    user_id, 
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.REQUEST)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.REQUEST)

  await CounterCollector.upload()

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

  preDatabaseMetric.total_item_investigations++
  preDatabaseMetric.unique_item_investigations++
  preDatabaseMetric.unique_title_investigations++
  preDatabaseMetric.total_item_requests++
  preDatabaseMetric.unique_item_requests++
  preDatabaseMetric.unique_title_requests++

  // 访问后的状态
  const {postItemMetric,postTitleMetric,postPlatformMetric, postDatabaseMetric } = await getPostStatus('test7038','test8695', 'test1', 'database1', month)
  assert.deepStrictEqual(postItemMetric, preItemMetric)
  assert.deepStrictEqual(postTitleMetric, preTitleMetric)
  assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
  assert.deepStrictEqual(postDatabaseMetric, preDatabaseMetric)
  console.log("测试短时间内下载一个item两次通过")
}

// 测试no_license platform1 -> title1-2 -> item1-2-1
async function testNoLicense(month: string): Promise<any> {
  CounterCollector.init({baseUrl: CounterCollector.baseURL})
  const {preItemMetric,preTitleMetric,prePlatformMetric, preDatabaseMetric } = await getPreStatus('test7038','test8695', 'test1', 'database1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问了item1-2-1
  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.NO_LICENSE)

  await CounterCollector.upload()

  preItemMetric.no_license++
  preTitleMetric.no_license++
  prePlatformMetric.no_license++
  preDatabaseMetric.no_license++

  // 访问后的状态
  const {postItemMetric,postTitleMetric,postPlatformMetric, postDatabaseMetric } = await getPostStatus('test7038','test8695', 'test1', 'database1', month)
  assert.deepStrictEqual(postItemMetric, preItemMetric)
  assert.deepStrictEqual(postTitleMetric, preTitleMetric)
  assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
  assert.deepStrictEqual(postDatabaseMetric, preDatabaseMetric)
  console.log("测试no_license通过")
}

// 测试no_license platform1 -> title1-2 -> item1-2-1两次
async function testDoubleClickNoLicense(month:string): Promise<any> {
  CounterCollector.init({baseUrl: CounterCollector.baseURL})
  const {preItemMetric,preTitleMetric,prePlatformMetric, preDatabaseMetric } = await getPreStatus('test7038','test8695', 'test1', 'database1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问了item1-2-1
  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.NO_LICENSE)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.NO_LICENSE)

  await CounterCollector.upload()

  preItemMetric.no_license++
  preTitleMetric.no_license++
  prePlatformMetric.no_license++
  preDatabaseMetric.no_license++

  // 访问后的状态
  const {postItemMetric,postTitleMetric,postPlatformMetric, postDatabaseMetric } = await getPostStatus('test7038','test8695', 'test1', 'database1', month)
  assert.deepStrictEqual(postItemMetric, preItemMetric)
  assert.deepStrictEqual(postTitleMetric, preTitleMetric)
  assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
  assert.deepStrictEqual(postDatabaseMetric, preDatabaseMetric)
  console.log("测试短时间内no_license两次通过")
}

// 测试limit_exceeded platform1 -> title1-2 -> item1-2-1
async function testLimitExceeded(month:string): Promise<any> {
  CounterCollector.init({baseUrl: CounterCollector.baseURL})
  const {preItemMetric,preTitleMetric,prePlatformMetric,preDatabaseMetric } = await getPreStatus('test7038','test8695', 'test1', 'database1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问了item1-2-1
  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.LIMIT_EXCEEDED)

  await CounterCollector.upload()
  
  preItemMetric.limit_exceeded++
  preTitleMetric.limit_exceeded++
  prePlatformMetric.limit_exceeded++
  preDatabaseMetric.limit_exceeded++

  // 访问后的状态
  const {postItemMetric,postTitleMetric,postPlatformMetric, postDatabaseMetric } = await getPostStatus('test7038','test8695', 'test1','database1', month)
  assert.deepStrictEqual(postItemMetric, preItemMetric)
  assert.deepStrictEqual(postTitleMetric, preTitleMetric)
  assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
  assert.deepStrictEqual(postDatabaseMetric, preDatabaseMetric)
  console.log("测试超出限额通过")
}

// 测试limit_exceeded platform1 -> title1-2 -> item1-2-1两次
async function testDoubleClickLimitExceeded(month:string): Promise<any> {
  CounterCollector.init({baseUrl: CounterCollector.baseURL})
  const {preItemMetric,preTitleMetric,prePlatformMetric, preDatabaseMetric } = await getPreStatus('test7038','test8695', 'test1','database1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问了item1-2-1
  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.LIMIT_EXCEEDED)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.LIMIT_EXCEEDED)

  await CounterCollector.upload()
  
  preItemMetric.limit_exceeded++
  preTitleMetric.limit_exceeded++
  prePlatformMetric.limit_exceeded++
  preDatabaseMetric.limit_exceeded++

  // 访问后的状态
  const {postItemMetric,postTitleMetric,postPlatformMetric,postDatabaseMetric } = await getPostStatus('test7038','test8695', 'test1','database1', month)
  assert.deepStrictEqual(postItemMetric, preItemMetric)
  assert.deepStrictEqual(postTitleMetric, preTitleMetric)
  assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
  assert.deepStrictEqual(postDatabaseMetric, preDatabaseMetric)
  console.log("测试短时间内超出限额两次通过")
}
// 测试定时上传
async function testTimeout(month: string): Promise<any> {
  CounterCollector.init({interval: 5000,baseUrl: CounterCollector.baseURL})
  // 访问前的状态
  const {preItemMetric,preTitleMetric,prePlatformMetric,preDatabaseMetric } = await getPreStatus('test7038','test8695', 'test1','database1', month)
  // 访问了item1-2-1
  CounterCollector.collect(
    await CounterCollector.getUserId(),
    await CounterCollector.getSessionId(),
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)

  preItemMetric.total_item_investigations++
  preItemMetric.unique_item_investigations++

  preTitleMetric.total_item_investigations++
  preTitleMetric.unique_item_investigations++
  preTitleMetric.unique_title_investigations++

  prePlatformMetric.total_item_investigations++
  prePlatformMetric.unique_item_investigations++
  prePlatformMetric.unique_title_investigations++

  preDatabaseMetric.total_item_investigations++
  preDatabaseMetric.unique_item_investigations++
  preDatabaseMetric.unique_title_investigations++

  return new Promise((resolve) => {
    setTimeout(async function(){
      // 访问后的状态
      const {postItemMetric,postTitleMetric,postPlatformMetric, postDatabaseMetric } = await getPostStatus('test7038','test8695', 'test1', 'database1', month)
      assert.deepStrictEqual(postItemMetric, preItemMetric)
      assert.deepStrictEqual(postTitleMetric, preTitleMetric)
      assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
      assert.deepStrictEqual(postDatabaseMetric, preDatabaseMetric)
      console.log('测试定时上传访问一个item通过')
      resolve('ok')
    }, UploadInterval)
  })
}

// 连续double click 访问item
async function testTimeoutContinuousDoubleClickItem(month: string): Promise<any> {
  CounterCollector.init({interval: 5000,baseUrl: CounterCollector.baseURL})
  // 访问前的状态
  const {preItemMetric,preTitleMetric,prePlatformMetric,preDatabaseMetric } = await getPreStatus('test7038','test8695', 'test1','database1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 短时间内连续访问3次item1-2-1， 应只记录一次
  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)

  preItemMetric.total_item_investigations++
  preItemMetric.unique_item_investigations++

  preTitleMetric.total_item_investigations++
  preTitleMetric.unique_item_investigations++
  preTitleMetric.unique_title_investigations++

  prePlatformMetric.total_item_investigations++
  prePlatformMetric.unique_item_investigations++
  prePlatformMetric.unique_title_investigations++

  preDatabaseMetric.total_item_investigations++
  preDatabaseMetric.unique_item_investigations++
  preDatabaseMetric.unique_title_investigations++

  return new Promise((resolve) => {
    setTimeout(async function(){
      // 访问后的状态
      const {postItemMetric,postTitleMetric,postPlatformMetric,postDatabaseMetric } = await getPostStatus('test7038','test8695', 'test1','database1', month)
      assert.deepStrictEqual(postItemMetric, preItemMetric)
      assert.deepStrictEqual(postTitleMetric, preTitleMetric)
      assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
      assert.deepStrictEqual(postDatabaseMetric, preDatabaseMetric)
      console.log('测试定时上传，短时间内连续访问一个item通过')
      resolve('ok')
    }, UploadInterval)
  })
}

// 间隔30s以上访问item
async function testTimeoutNotDoubleClickItem(month: string): Promise<any> {
  CounterCollector.init({interval: 5000,baseUrl: CounterCollector.baseURL})
  // 访问前的状态
  const {preItemMetric,preTitleMetric,prePlatformMetric,preDatabaseMetric } = await getPreStatus('test7038','test8695', 'test1','database1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 间隔30s以上访问2次item1-2-1， 应记录两次
  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)

  preItemMetric.total_item_investigations = preItemMetric.total_item_investigations + 2
  preItemMetric.unique_item_investigations++

  preTitleMetric.total_item_investigations = preTitleMetric.total_item_investigations + 2
  preTitleMetric.unique_item_investigations++
  preTitleMetric.unique_title_investigations++

  prePlatformMetric.total_item_investigations = prePlatformMetric.total_item_investigations + 2
  prePlatformMetric.unique_item_investigations++
  prePlatformMetric.unique_title_investigations++

  preDatabaseMetric.total_item_investigations = preDatabaseMetric.total_item_investigations + 2
  preDatabaseMetric.unique_item_investigations++
  preDatabaseMetric.unique_title_investigations++
      
  return new Promise((resolve) => {
    setTimeout(() => {
      CounterCollector.collect(
        user_id,
        session_id,
        {
          item_id: 'test7038',
          title_id: 'test8695',
          platform_id: 'test1',
          database_id: 'database1'
        },
        MetricType.INVESTIGATION)  

      setTimeout(async function(){
        // 访问后的状态
        const {postItemMetric,postTitleMetric,postPlatformMetric, postDatabaseMetric } = await getPostStatus('test7038','test8695', 'test1','database1', month)
        assert.deepStrictEqual(postItemMetric, preItemMetric)
        assert.deepStrictEqual(postTitleMetric, preTitleMetric)
        assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
        assert.deepStrictEqual(postDatabaseMetric, preDatabaseMetric)
        console.log('测试定时上传，间隔30s以上访问一个item两次通过')
        resolve('ok')
      }, UploadInterval)
    }, LongerDoubleClickInternal)
  })
}

// 访问，下载，no_license. limit_exceeded各触发一次
async function testTimeoutAllOptionItem(month: string): Promise<any> {
  CounterCollector.init({interval: 5000,baseUrl: CounterCollector.baseURL})
  // 访问前的状态
  const {preItemMetric,preTitleMetric,prePlatformMetric,preDatabaseMetric } = await getPreStatus('test7038','test8695', 'test1','database1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问，下载，no_license. limit_exceeded各触发一次
  CounterCollector.collect(
    user_id, 
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.REQUEST)

  CounterCollector.collect(
    user_id, 
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.NO_LICENSE)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.LIMIT_EXCEEDED)

  preItemMetric.total_item_investigations = preItemMetric.total_item_investigations + 2
  preItemMetric.total_item_requests++
  preItemMetric.unique_item_investigations++
  preItemMetric.unique_item_requests++
  preItemMetric.limit_exceeded++
  preItemMetric.no_license++

  preTitleMetric.total_item_investigations = preTitleMetric.total_item_investigations + 2
  preTitleMetric.total_item_requests++
  preTitleMetric.unique_item_investigations++
  preTitleMetric.unique_item_requests++
  preTitleMetric.unique_title_investigations++
  preTitleMetric.unique_title_requests++
  preTitleMetric.limit_exceeded++
  preTitleMetric.no_license++

  prePlatformMetric.total_item_investigations = prePlatformMetric.total_item_investigations + 2
  prePlatformMetric.total_item_requests++
  prePlatformMetric.unique_item_investigations++
  prePlatformMetric.unique_item_requests++
  prePlatformMetric.unique_title_investigations++
  prePlatformMetric.unique_title_requests++
  prePlatformMetric.no_license++
  prePlatformMetric.limit_exceeded++

  preDatabaseMetric.total_item_investigations = preDatabaseMetric.total_item_investigations + 2
  preDatabaseMetric.total_item_requests++
  preDatabaseMetric.unique_item_investigations++
  preDatabaseMetric.unique_item_requests++
  preDatabaseMetric.unique_title_investigations++
  preDatabaseMetric.unique_title_requests++
  preDatabaseMetric.no_license++
  preDatabaseMetric.limit_exceeded++

  return new Promise((resolve) => {
    setTimeout(async function(){
      // 访问后的状态
      const {postItemMetric,postTitleMetric,postPlatformMetric,postDatabaseMetric } = await getPostStatus('test7038','test8695', 'test1','database1', month)
      assert.deepStrictEqual(postItemMetric, preItemMetric)
      assert.deepStrictEqual(postTitleMetric, preTitleMetric)
      assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
      assert.deepStrictEqual(postDatabaseMetric, preDatabaseMetric)
      console.log('测试定时上传，访问，下载，no_license. limit_exceeded各触发一次通过')
      resolve('ok')
    }, UploadInterval)
  })
}

// 访问一次，下载两次间隔30s以上，no_license double click, limit_exceeded double click两次
async function testTimeoutComplicateOption(month: string): Promise<any> {
  CounterCollector.init({interval: 5000,baseUrl: CounterCollector.baseURL})
  // 访问前的状态
  const {preItemMetric,preTitleMetric,prePlatformMetric,preDatabaseMetric } = await getPreStatus('test7038','test8695', 'test1','database1', month)
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问一次，下载两次间隔30s以上，no_license double click. limit_exceeded double click两次
  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)
  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.REQUEST)

  setTimeout(() =>{
    CounterCollector.collect(
      user_id,
      session_id,
      {
        item_id: 'test7038',
        title_id: 'test8695',
        platform_id: 'test1',
        database_id: 'database1'
      },
      MetricType.REQUEST)
  }, LongerDoubleClickInternal)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.NO_LICENSE)
     
  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.NO_LICENSE)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.LIMIT_EXCEEDED)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.LIMIT_EXCEEDED)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.LIMIT_EXCEEDED)

  preItemMetric.total_item_investigations = preItemMetric.total_item_investigations + 3
  preItemMetric.total_item_requests = preItemMetric.total_item_requests + 2
  preItemMetric.unique_item_investigations++
  preItemMetric.unique_item_requests++
  preItemMetric.limit_exceeded++
  preItemMetric.no_license++

  preTitleMetric.total_item_investigations = preTitleMetric.total_item_investigations + 3
  preTitleMetric.total_item_requests = preTitleMetric.total_item_requests + 2
  preTitleMetric.unique_item_investigations++
  preTitleMetric.unique_item_requests++
  preTitleMetric.unique_title_investigations++
  preTitleMetric.unique_title_requests++
  preTitleMetric.limit_exceeded++
  preTitleMetric.no_license++

  prePlatformMetric.total_item_investigations = prePlatformMetric.total_item_investigations + 3
  prePlatformMetric.total_item_requests = prePlatformMetric.total_item_requests + 2
  prePlatformMetric.unique_item_investigations++
  prePlatformMetric.unique_item_requests++
  prePlatformMetric.unique_title_investigations++
  prePlatformMetric.unique_title_requests++
  prePlatformMetric.no_license++
  prePlatformMetric.limit_exceeded++

  preDatabaseMetric.total_item_investigations = preDatabaseMetric.total_item_investigations + 3
  preDatabaseMetric.total_item_requests = preDatabaseMetric.total_item_requests + 2
  preDatabaseMetric.unique_item_investigations++
  preDatabaseMetric.unique_item_requests++
  preDatabaseMetric.unique_title_investigations++
  preDatabaseMetric.unique_title_requests++
  preDatabaseMetric.no_license++
  preDatabaseMetric.limit_exceeded++

  return new Promise((resolve) => {
    setTimeout(async function(){
      // 访问后的状态
      const {postItemMetric,postTitleMetric,postPlatformMetric, postDatabaseMetric } = await getPostStatus('test7038','test8695', 'test1', 'database1', month)
      assert.deepStrictEqual(postItemMetric, preItemMetric)
      assert.deepStrictEqual(postTitleMetric, preTitleMetric)
      assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
      assert.deepStrictEqual(postDatabaseMetric, preDatabaseMetric)
      console.log('测试访问一次，下载两次间隔30s以上，no_license double click. limit_exceeded double click两次通过')
      resolve('ok')
    }, UploadInterval)
  })
}

// 测试访问两个不同的item
async function testDifferentInvestigation(month: string): Promise<any> {
  CounterCollector.init({interval: 5000,baseUrl: CounterCollector.baseURL})
  // 访问前的状态
  const {preItemMetric: preItemMetric1,preTitleMetric,prePlatformMetric,preDatabaseMetric } = await getPreStatus('test7038','test8695', 'test1', 'database1', month)
  const {preItemMetric: preItemMetric2} = await getPreStatus('test9129','', '','', month)
  
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  // 访问了item1-2-1和item-1-2-2
  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test9129',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)
  
  preItemMetric1.total_item_investigations++
  preItemMetric1.unique_item_investigations++
  preItemMetric2.total_item_investigations++
  preItemMetric2.unique_item_investigations++

  preTitleMetric.total_item_investigations = preTitleMetric.total_item_investigations + 2
  preTitleMetric.unique_item_investigations = preTitleMetric.unique_item_investigations + 2
  preTitleMetric.unique_title_investigations++

  prePlatformMetric.total_item_investigations =  prePlatformMetric.total_item_investigations + 2
  prePlatformMetric.unique_item_investigations =  prePlatformMetric.unique_item_investigations + 2
  prePlatformMetric.unique_title_investigations++

  preDatabaseMetric.total_item_investigations =  preDatabaseMetric.total_item_investigations + 2
  preDatabaseMetric.unique_item_investigations =  preDatabaseMetric.unique_item_investigations + 2
  preDatabaseMetric.unique_title_investigations++
  
  return new Promise((resolve) => {
    setTimeout(async () => {
    // 访问后的状态
      const {postItemMetric: postItemMetric1, postTitleMetric,postPlatformMetric,postDatabaseMetric } = await getPostStatus('test7038','test8695', 'test1', 'database1', month)
      const {postItemMetric: postItemMetric2} = await getPostStatus('test9129','', '','', month)
      assert.deepStrictEqual(postItemMetric1, preItemMetric1)
      assert.deepStrictEqual(postItemMetric2, preItemMetric2)
      assert.deepStrictEqual(postTitleMetric, preTitleMetric)
      assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
      assert.deepStrictEqual(postDatabaseMetric, preDatabaseMetric)
      console.log('测试访问同一title不同item通过')
      resolve('ok')
    }, UploadInterval)
  })
}

async function testCounterScenario(month: string): Promise<any> {
  CounterCollector.init({interval: 5000,baseUrl: CounterCollector.baseURL})
  // 访问前的状态
  const {preItemMetric: preItemMetric1, prePlatformMetric, preDatabaseMetric } = await getPreStatus('test7861','test3971', 'test2', 'database1', month)
  // const {preItemMetric: preItemMetric2} = await getPreStatus('test3742','', '','', month)
  // const {preItemMetric: preItemMetric3} = await getPreStatus('test3058','', '','', month)
  // const {preItemMetric: preItemMetric4} = await getPreStatus('test3456','', '','', month)
  
  
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()

  // 访问3个文章摘要（2个是属于同一日志），一个视频，下载之前两篇文章的pdf（属于同一日志），案例来自Release_5_TechNotes_PDFX_20190509-Revised
  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7861',
      title_id: 'test3971',
      platform_id: 'test2',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test3742',
      title_id: 'test3971',
      platform_id: 'test2',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test3058',
      title_id: 'test7089',
      platform_id: 'test2',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test3456',
      title_id: 'test5647',
      platform_id: 'test2',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7861',
      title_id: 'test3971',
      platform_id: 'test2',
      database_id: 'database1'
    },
    MetricType.REQUEST)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test3742',
      title_id: 'test3971',
      platform_id: 'test2',
      database_id: 'database1'
    },
    MetricType.REQUEST)

  prePlatformMetric.total_item_investigations = prePlatformMetric.total_item_investigations + 6
  prePlatformMetric.unique_item_investigations = prePlatformMetric.unique_item_investigations + 4
  prePlatformMetric.unique_title_investigations = prePlatformMetric.unique_title_investigations + 3
  prePlatformMetric.total_item_requests = prePlatformMetric.total_item_requests + 2
  prePlatformMetric.unique_item_requests = prePlatformMetric.unique_item_requests + 2
  prePlatformMetric.unique_title_requests++

  preDatabaseMetric.total_item_investigations = preDatabaseMetric.total_item_investigations + 6
  preDatabaseMetric.unique_item_investigations = preDatabaseMetric.unique_item_investigations + 4
  preDatabaseMetric.unique_title_investigations = preDatabaseMetric.unique_title_investigations + 3
  preDatabaseMetric.total_item_requests = preDatabaseMetric.total_item_requests + 2
  preDatabaseMetric.unique_item_requests = preDatabaseMetric.unique_item_requests + 2
  preDatabaseMetric.unique_title_requests++

  return new Promise((resolve) => {
    setTimeout(async function(){
      const {postPlatformMetric, postDatabaseMetric } = await getPostStatus('','', 'test2', 'database1', month)

      assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
      assert.deepStrictEqual(postDatabaseMetric, preDatabaseMetric)
      console.log('测试访问3个文章摘要（2个是属于同一日志），一个视频，下载之前两篇文章的pdf（属于同一日志）通过')
      resolve('ok')
    }, UploadInterval)
  })
}

async function testSearchesDatabase(month:string): Promise<any> {
  CounterCollector.init({interval: 5000,baseUrl: CounterCollector.baseURL})
  // 访问前的状态
  const { prePlatformMetric, preDatabaseMetric } = await getPreStatus('','', 'test1', 'database1', month)

  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()
  CounterCollector.collect(
    user_id,
    session_id,
    {
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.SEARCHES_REGULAR)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.SEARCHES_AUTOMATED)

  CounterCollector.collect(
    user_id,
    session_id,
    {
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.SEARCHES_FEDERATED)

  preDatabaseMetric.searches_regular++
  preDatabaseMetric.searches_automated++
  preDatabaseMetric.searches_federated++
  prePlatformMetric.searches_platform = prePlatformMetric.searches_platform + 2 


  return new Promise((resolve) => {
    setTimeout(async function(){
      const {postPlatformMetric, postDatabaseMetric } = await getPostStatus('','', 'test1', 'database1', month)

      assert.deepStrictEqual(postPlatformMetric, prePlatformMetric)
      assert.deepStrictEqual(postDatabaseMetric, preDatabaseMetric)
      console.log('测试数据库搜索指标成功')
      resolve('ok')
    }, UploadInterval)
  })
}

async function testClear(month:string): Promise<any> {
  CounterCollector.init({interval:5000, baseUrl: CounterCollector.baseURL})
  const user_id = await CounterCollector.getUserId()
  const session_id = await CounterCollector.getSessionId()

  CounterCollector.collect(
    user_id,
    session_id,
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)

  CounterCollector.collect(
    user_id,
    session_id+'123',
    {
      item_id: 'test7038',
      title_id: 'test8695',
      platform_id: 'test1',
      database_id: 'database1'
    },
    MetricType.INVESTIGATION)
  console.log(CounterCollector[counterStorage])
  
  // return new Promise((resolve) => {
  //   setTimeout(() => {
  //     console.log(CounterCollector[counterStorage])
  //     resolve('ok')
  //   }, 6000)
  // })
}