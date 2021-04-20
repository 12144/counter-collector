import { getRecord } from "../request"

export async function getPreItemMetric(item_id:string, month: string): Promise<any>{
  const result = await getRecord({
    table: 'Item_Metric',
    condition: {
      item_id,
      month,
      access_method: 'Regular',
    }
  })

  return  result.data || {
    item_id,
    month: new Date(new Date(month).getTime()).toJSON(),
    access_method: 'Regular',
    total_item_investigations: 0,
    unique_item_investigations: 0,
    total_item_requests: 0,
    unique_item_requests: 0,
    no_license: 0,
    limit_exceeded: 0,
  }
}

export async function getPostItemMetric(item_id:string, month: string): Promise<any> {
  const result = await getRecord({
    table: 'Item_Metric',
    condition: {
      item_id,
      month,
      access_method: 'Regular',
    }
  })
  return result.data
}

export async function getPreTitleMetric(title_id:string, month: string): Promise<any>{
  const result =  await getRecord({
    table: 'Title_Metric',
    condition: {
      title_id,
      month,
      access_method: 'Regular',
    }
  }) 
  return result.data || {
    title_id,
    month: new Date(new Date(month).getTime()).toJSON(),
    access_method: 'Regular',
    total_item_investigations: 0,
    unique_item_investigations: 0,
    total_item_requests: 0,
    unique_item_requests: 0,
    no_license: 0,
    limit_exceeded: 0,
    unique_title_investigations: 0,
    unique_title_requests: 0
  }
}

export async function getPostTitleMetric(title_id:string, month: string): Promise<any> {
  const result = await getRecord({
    table: 'Title_Metric',
    condition: {
      title_id,
      month,
      access_method: 'Regular',
    }
  })
  return result.data
}

export async function getPrePlatformMetric(platform_id:string, month: string): Promise<any>{
  const result = await getRecord({
    table: 'Platform_Metric',
    condition: {
      platform_id,
      month,
      access_method: 'Regular',
    }
  }) 
  return result.data || {
    platform_id,
    month: new Date(new Date(month).getTime()).toJSON(),
    access_method: 'Regular',
    total_item_investigations: 0,
    unique_item_investigations: 0,
    total_item_requests: 0,
    unique_item_requests: 0,
    no_license: 0,
    limit_exceeded: 0,
    unique_title_investigations: 0,
    unique_title_requests: 0,
    searches_platform: 0
  }
}

export async function getPostPlatformMetric(platform_id:string, month: string): Promise<any> {
  const result = await getRecord({
    table: 'Platform_Metric',
    condition: {
      platform_id,
      month,
      access_method: 'Regular',
    }
  })
  return result.data
}

export async function getPreDatabaseMetric(database_id:string, month: string): Promise<any>{
  const result = await getRecord({
    table: 'Database_Metric',
    condition: {
      database_id,
      month,
      access_method: 'Regular',
    }
  }) 
  return result.data || {
    database_id,
    month: new Date(new Date(month).getTime()).toJSON(),
    access_method: 'Regular',
    total_item_investigations: 0,
    unique_item_investigations: 0,
    total_item_requests: 0,
    unique_item_requests: 0,
    no_license: 0,
    limit_exceeded: 0,
    unique_title_investigations: 0,
    unique_title_requests: 0
  }
}

export async function getPostDatabaseMetric(database_id:string, month: string): Promise<any> {
  const result = await getRecord({
    table: 'Database_Metric',
    condition: {
      database_id,
      month,
      access_method: 'Regular',
    }
  })
  return result.data
}

export async function getPreStatus(item_id: string, title_id: string, platform_id: string, database_id: string, month: string):Promise<any> {
  const preItemMetric = item_id ? await getPreItemMetric(item_id, month) : null
  const preTitleMetric = title_id ? await getPreTitleMetric(title_id, month) : null
  const prePlatformMetric = platform_id ? await getPrePlatformMetric(platform_id, month) : null
  const preDatabaseMetric = database_id ? await getPreDatabaseMetric(database_id, month) : null

  return {
    preItemMetric,
    preTitleMetric,
    prePlatformMetric,
    preDatabaseMetric,
  }
}

export function getPostStatus(item_id:string, title_id:string, platform_id:string, database_id: string, month:string): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const postItemMetric = item_id ? await getPostItemMetric(item_id, month) : null
      const postTitleMetric = title_id ? await getPostTitleMetric(title_id, month) : null
      const postPlatformMetric = platform_id ? await getPostPlatformMetric(platform_id, month) : null
      const postDatabaseMetric = database_id ? await getPostDatabaseMetric(database_id, month) : null

      resolve( {
        postItemMetric,
        postTitleMetric,
        postPlatformMetric,
        postDatabaseMetric
      })
    }, 2000) // 给个延迟，保证数据都更新至数据库中
  })
}