import axios, { AxiosPromise, AxiosRequestConfig } from "axios"
// import Cookie from "js-cookie"


const baseURL = "http://127.0.0.1:7001"

const instance = axios.create({
  baseURL: baseURL,
  withCredentials: true,
})

// 前端请求设置csrfToken
instance.interceptors.request.use((config: AxiosRequestConfig) => {
  // csrf按官网的设置一直出错先不启用
  // config.headers['x-csrf-token'] = Cookie.get('csrfToken');
  return config
})

function Post<T, R=AxiosPromise<T>>(url: string, data: any, config?: AxiosRequestConfig): Promise<R> {
  return instance.post(url, data, config)
}

// 上传数据
export interface CounterData {
  user_id:string;
  item_id:string;
  parent_id: string;
  requests: number;
  investigations: number;
  no_license: number;
  limit_exceeded: number;
}
export function uploadData(data: CounterData[]): Promise<any> {
  return Post("/upload", data)
}