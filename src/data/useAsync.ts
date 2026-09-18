import { useEffect, useState } from 'react'

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error'; error: Error }

/**
 * 把一个返回 Promise 的加载函数包成模块级缓存：多次调用（含 StrictMode 重复挂载）只执行一次；
 * 失败时清掉缓存，下次调用可以重试。
 */
export function cachedLoader<T>(load: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | undefined
  return () => {
    promise ??= load().catch((error: unknown) => {
      promise = undefined
      throw error
    })
    return promise
  }
}

/** 订阅一个稳定的加载函数（模块级常量），得到 loading / ready / error 状态 */
export function useAsync<T>(load: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    load().then(
      (value) => {
        if (!cancelled) setState({ status: 'ready', value })
      },
      (error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            error: error instanceof Error ? error : new Error(String(error)),
          })
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [load])

  return state
}
