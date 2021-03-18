"use strict";
exports.__esModule = true;
exports.getRecord = exports.getUserIP = exports.uploadData = void 0;
var axios_1 = require("axios");
// import Cookie from "js-cookie"
var baseURL = "http://localhost/counter";
var instance = axios_1["default"].create({
    baseURL: baseURL,
    withCredentials: true
});
// 前端请求设置csrfToken
instance.interceptors.request.use(function (config) {
    // csrf按官网的设置一直出错先不启用
    // config.headers['x-csrf-token'] = Cookie.get('csrfToken');
    return config;
});
instance.interceptors.response.use(function (response) {
    return response.data;
});
function Post(url, data, config) {
    return instance.post(url, data, config);
}
function Get(url, config) {
    return instance.get(url, config);
}
function uploadData(data) {
    return Post("/upload", data);
}
exports.uploadData = uploadData;
// 获取用户ip
function getUserIP() {
    return Get("/getUserIP");
}
exports.getUserIP = getUserIP;
var getRecord = function (data) {
    return Post('/get', data);
};
exports.getRecord = getRecord;
