import { useEffect, useState } from 'react'
import worldUrl from 'world-atlas/countries-50m.json?url'
import { buildWorld } from '../geo/world'
import type { WorldModel, WorldTopology } from '../geo/types'

let worldPromise: Promise<WorldModel> | undefined

/**
 * 加载并构建世界模型。模块级缓存：多次调用（含 StrictMode 重复挂载）只请求一次；
 * 失败时清掉缓存，下次调用可以重试。
 */
export function loadWorld(): Promise<WorldModel> {
  worldPromise ??= fetch(worldUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`地图数据加载失败：${response.status} ${response.statusText}`)
      }
      return response.json() as Promise<WorldTopology>
    })
    .then(buildWorld)
    .catch((error: unknown) => {
      worldPromise = undefined
      throw error
    })
  return worldPromise
}

export type WorldState =
  | { status: 'loading' }
  | { status: 'ready'; world: WorldModel }
  | { status: 'error'; error: Error }

export function useWorld(): WorldState {
  const [state, setState] = useState<WorldState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    loadWorld().then(
      (world) => {
        if (!cancelled) setState({ status: 'ready', world })
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
  }, [])

  return state
}
