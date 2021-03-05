"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadData = void 0;
const axios_1 = __importDefault(require("axios"));
// import Cookie from "js-cookie"
const baseURL = "http://127.0.0.1:7001";
const instance = axios_1.default.create({
    baseURL: baseURL,
    withCredentials: true,
});
// 前端请求设置csrfToken
instance.interceptors.request.use((config) => {
    // csrf按官网的设置一直出错先不启用
    // config.headers['x-csrf-token'] = Cookie.get('csrfToken');
    return config;
});
function Post(url, data, config) {
    return instance.post(url, data, config);
}
function uploadData(data) {
    return Post("/upload", data);
}
exports.uploadData = uploadData;
