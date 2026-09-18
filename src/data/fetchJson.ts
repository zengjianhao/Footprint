export async function fetchJson<T>(url: string, label: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${label}加载失败：${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}
