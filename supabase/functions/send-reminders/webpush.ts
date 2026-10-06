// Web Push (RFC 8291 aes128gcm + VAPID RFC 8292) só com WebCrypto: roda no Deno (Edge Functions) e no Node.

export interface PushSub {
  endpoint: string
  p256dh: string
  auth: string
}

export interface Vapid {
  publicKey: string // base64url, ponto não comprimido (65 bytes)
  privateKey: string // base64url, escalar d (32 bytes)
  subject: string // mailto: ou https:
}

const enc = new TextEncoder()

export function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let bin = ''
  for (const x of u) bin += String.fromCharCode(x)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, bytes: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8))
}

/** JWT ES256 para o cabeçalho Authorization: vapid t=…, k=… */
export async function vapidAuth(endpoint: string, v: Vapid, expSeconds = 12 * 3600): Promise<string> {
  const pub = b64urlDecode(v.publicKey)
  const jwk = { kty: 'EC', crv: 'P-256', x: b64urlEncode(pub.slice(1, 33)), y: b64urlEncode(pub.slice(33, 65)), d: v.privateKey, ext: true }
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const header = b64urlEncode(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const aud = new URL(endpoint).origin
  const claims = b64urlEncode(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + expSeconds, sub: v.subject })))
  const unsigned = `${header}.${claims}`
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(unsigned))
  return `vapid t=${unsigned}.${b64urlEncode(sig)}, k=${v.publicKey}`
}

/** Criptografa a mensagem para a inscrição (corpo aes128gcm com um único registro) */
export async function encryptPayload(sub: PushSub, payload: Uint8Array, salt = crypto.getRandomValues(new Uint8Array(16))): Promise<Uint8Array> {
  const uaPublic = b64urlDecode(sub.p256dh)
  const authSecret = b64urlDecode(sub.auth)
  const as = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', as.publicKey))
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, as.privateKey, 256))

  const keyInfo = concat(enc.encode('WebPush: info\0'), uaPublic, asPublic)
  const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32)
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12)

  const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  const plain = concat(payload, new Uint8Array([2])) // delimitador do último registro
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, plain))

  const rs = new Uint8Array(4)
  new DataView(rs.buffer).setUint32(0, 4096)
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, cipher)
}

export interface SendResult {
  ok: boolean
  status: number
  /** Inscrição expirada/inválida: pode ser apagada */
  gone: boolean
  text?: string
}

export async function sendPush(sub: PushSub, message: unknown, v: Vapid, ttl = 6 * 3600): Promise<SendResult> {
  const body = await encryptPayload(sub, enc.encode(JSON.stringify(message)))
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await vapidAuth(sub.endpoint, v),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(ttl),
      Urgency: 'normal'
    },
    body
  })
  const text = res.ok ? undefined : (await res.text()).slice(0, 300)
  return { ok: res.ok, status: res.status, gone: res.status === 404 || res.status === 410, text }
}
