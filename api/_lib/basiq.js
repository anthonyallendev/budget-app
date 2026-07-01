const BASE_URL = 'https://au-api.basiq.io'

async function getToken() {
  const res = await fetch(`${BASE_URL}/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${process.env.BASIQ_API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'basiq-version': '3.0',
    },
    body: 'scope=SERVER_ACCESS',
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Basiq token error ${res.status}: ${text}`)
  return JSON.parse(text).access_token
}

export async function basiq(method, path, body) {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'basiq-version': '3.0',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) throw new Error(`Basiq ${method} ${path} ${res.status}: ${JSON.stringify(data)}`)
  return data
}
