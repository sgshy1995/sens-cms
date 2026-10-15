import axios from 'axios'
import store from '@/store'
import storage from 'store'
import notification from 'ant-design-vue/es/notification'
import { VueAxios } from './axios'
import { ACCESS_TOKEN } from '@/store/mutation-types'

// 创建 axios 实例
const request = axios.create({
  // API 请求的默认前缀
  baseURL: process.env.VUE_APP_API_BASE_URL,
  timeout: 6000 // 请求超时时间
})

// 异常拦截处理器
const errorHandler = (error) => {
  if (error.response) {
    const data = error.response.data
    // 统一错误结构，便于调用方通过 err.data.message 读取后端返回信息
    if (data !== undefined) {
      error.data = data
    }
    // 从 localstorage 获取 token
    const token = storage.get(ACCESS_TOKEN)
    if (error.response.status === 403) {
      /* notification.error({
        message: 'Forbidden',
        description: data.message
      }) */
    }
    if (error.response.status === 401 && !(data && data.result && data.result.isLogin)) {
      notification.error({
        message: 'Unauthorized',
        description: 'Authorization verification failed'
      })
      if (token) {
        store.dispatch('Logout').then(() => {
          /* setTimeout(() => {
            window.location.reload()
          }, 1500) */
        })
      }
    }
  }
  return Promise.reject(error)
}

// request interceptor
request.interceptors.request.use(config => {
  const token = storage.get(ACCESS_TOKEN)
  // 如果 token 存在
  // 让每个请求携带自定义 token 请根据实际情况自行修改
  if (token) {
    config.headers.Authorization = 'Bearer ' + token
  }
  return config
}, errorHandler)

// response interceptor
request.interceptors.response.use((response) => {
  const res = response.data
  // 后端统一以 HTTP 200 + 业务 code 返回，业务失败时 HTTP 状态同样是 200，
  // 因此需要在此把业务失败转换为 rejected Promise，交由调用方 catch 处理。
  if (res && typeof res.code === 'number' && res.code !== 200) {
    const businessError = new Error(res.message || '请求失败')
    businessError.data = res
    businessError.response = {
      status: res.code,
      data: res
    }
    businessError.isBusinessError = true
    return Promise.reject(businessError)
  }
  return res
}, errorHandler)

const installer = {
  vm: {},
  install (Vue) {
    Vue.use(VueAxios, request)
  }
}

export default request

export {
  installer as VueAxios,
  request as axios
}
