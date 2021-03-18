import axios, { AxiosPromise, AxiosRequestConfig, AxiosResponse } from "axios"
import { UploadData } from "../CounterStorage"

// import Cookie from "js-cookie"


const baseURL = "http://localhost/counter"

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

instance.interceptors.response.use((response: AxiosResponse) => {
  return response.data
})

function Post<T, R=AxiosPromise<T>>(url: string, data: any, config?: AxiosRequestConfig): Promise<R> {
  return instance.post(url, data, config)
}

function Get<T, R=AxiosPromise<T>>(url: string, config?: AxiosRequestConfig): Promise<R> {
  return instance.get(url, config)
}

export function uploadData(data: UploadData[]): Promise<any> {
  return Post("/upload", data)
}

// 获取用户ip
export function getUserIP(): Promise<any>{
  return Get("/getUserIP")
}

export const getRecord = (data: any):Promise<any> => {
  return Post('/getRecord', data)
}