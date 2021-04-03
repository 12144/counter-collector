import axios, { AxiosPromise, AxiosRequestConfig, AxiosResponse } from "axios"
import { UploadData } from "../CounterStorage"
import CounterCollector from '../CounterCollector'

const instance = axios.create({
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
  return instance.post(url, data, {baseURL: CounterCollector.baseURL, ...config})
}

function Get<T, R=AxiosPromise<T>>(url: string, config?: AxiosRequestConfig): Promise<R> {
  return instance.get(url, {baseURL: CounterCollector.baseURL, ...config})
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

export const initTest = ():Promise<any> => {
  return Get('/initTest')
}

export const clearTest = ():Promise<any> => {
  return Get('/clearTest')
}