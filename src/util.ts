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

export function mapToJson(map: Map<any, any>){
  return JSON.stringify(mapToObject(map))
}

export function jsonToMap(str: string){
  return objectToMap(JSON.parse(str))
}

