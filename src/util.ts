import { ItemMapValue, TitleMapValue } from "./CounterStorage"

function mapToObject(map: Map<any, any>) {
  const obj: any = {}
  for(const [key, value] of map) {
    if(value.map){
      const smallMap:any = {}
      for(const key2 in value.map){
        smallMap[key2] = mapToObject(value.map[key2])
      }
      value.map = smallMap
    }
    obj[key] = value
  }
  return obj
}

function objectToMap(obj: any){
  const map = new Map()
  for(const key in obj){
    if(obj[key].map){
      const smallMap:any = {}
      for(const key2 in obj[key].map){
        smallMap[key2] = objectToMap(obj[key].map[key2])
      }
      obj[key].map = smallMap
    }
    map.set(key, obj[key])
  }
  return map
}

export function mapToJson(map: Map<any, any>):string{
  return JSON.stringify(mapToObject(map))
}

export function jsonToMap(str: string):any{
  return objectToMap(JSON.parse(str))
}

function parseKey(key: string){
  return JSON.parse(key)
}

export function clearItemMap(itemMap: Map<string,ItemMapValue>, lastSessionId:string):void {
  const clear = (map: Map<string, number>) => {
    map.forEach((value,key,map)=>{
      const {session_id } = parseKey(key)
      if(session_id !== lastSessionId){
        map.delete(key)
      }
    })
  }

  itemMap.forEach((value,key,itemMap)=>{
    const maps = value.map
    clear(maps.requests)
    clear(maps.investigations)
    clear(maps.no_license)
    clear(maps.limit_exceeded)
    if(maps.requests.size || maps.investigations.size || maps.no_license.size || maps.limit_exceeded){
      value.unique_item_requests = 0
      value.total_item_requests = 0
      value.unique_item_investigations= 0
      value.total_item_investigations= 0
      value.no_license= 0
      value.limit_exceeded= 0
    }else{
      itemMap.delete(key)
    }
  })
}

export function clearTitleMap(titleMap: Map<string, TitleMapValue>, lastSessionId:string):void{
  const clear = (set: Set<string>) => {
    set.forEach((key)=>{
      const {session_id } = parseKey(key)
      if(session_id !== lastSessionId){
        set.delete(key)
      }
    })
  }

  titleMap.forEach((value,key,map)=>{
    const sets = value.map
    clear(sets.requests)
    clear(sets.investigations)
    if(sets.requests.size || sets.investigations.size){
      value.unique_item_requests = 0
      value.total_item_requests = 0
      value.unique_item_investigations = 0
      value.total_item_investigations = 0
      value.no_license = 0
      value.limit_exceeded = 0
      value.unique_title_requests = 0
      value.unique_title_investigations = 0
    }else{
      map.delete(key)
    }
  })
}