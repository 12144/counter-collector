import { getRecord } from "../request"

export async function getPreItemMetric(item_id:string, month: string): Promise<any>{
  const result = await getRecord({
    table: 'Item_Metric',
    condtiion: {
      item_id,
      month,
      access_method: 'Regular',
    }
  })
  return  result.data || {
    item_id,
    month,
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
    condtiion: {
      title_id,
      month,
      access_method: 'Regular',
    }
  }) 
  return result.data || {
    title_id,
    month,
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
    condtiion: {
      platform_id,
      month,
      access_method: 'Regular',
    }
  }) 
  return result.data || {
    platform_id,
    month,
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

export async function getPreStatus(item_id: string, title_id: string, platform_id: string, month: string):Promise<any> {
  const preItemMetric = await getPreItemMetric('7038', month)
  const preTitleMetric = await getPreTitleMetric('8695', month)
  const prePlatformMetric = await getPrePlatformMetric('1', month)

  return {
    preItemMetric,
    preTitleMetric,
    prePlatformMetric
  }
}

export async function getPostStatus(item_id:string, title_id:string, platform_id:string, month:string): Promise<any> {
  const postItemMetric = await getPostItemMetric('7038', month)
  const postTitleMetric = await getPostTitleMetric('8695', month)
  const postPlatformMetric = await getPostPlatformMetric('1', month)

  return {
    postItemMetric,
    postTitleMetric,
    postPlatformMetric
  }
}