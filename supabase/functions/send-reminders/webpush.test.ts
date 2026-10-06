import { describe, expect, it } from 'vitest'
import { createECDH, createHmac, createDecipheriv, createPublicKey, generateKeyPairSync, randomBytes, verify } from 'node:crypto'
import { b64urlEncode, encryptPayload, vapidAuth } from './webpush'

// Implementação independente do lado do navegador (RFC 8291) com node:crypto, para conferir a criptografia
const hmac = (key: Buffer, data: Buffer) => createHmac('sha256', key).update(data).digest()
const hkdf = (salt: Buffer, ikm: Buffer, info: Buffer, len: number) => hmac(hmac(salt, ikm), Buffer.concat([info, Buffer.from([1])])).subarray(0, len)

describe('web push', () => {
  it('o navegador consegue decifrar a mensagem (aes128gcm)', async () => {
    const ua = createECDH('prime256v1')
    ua.generateKeys()
    const auth = randomBytes(16)
    const sub = { endpoint: 'https://push.example.com/abc', p256dh: b64urlEncode(ua.getPublicKey()), auth: b64urlEncode(auth) }
    const msg = JSON.stringify({ title: 'Revisão', body: '12 questões pendentes — ação' })
    const body = Buffer.from(await encryptPayload(sub, new TextEncoder().encode(msg)))

    const salt = body.subarray(0, 16)
    expect(body.readUInt32BE(16)).toBe(4096)
    const idlen = body[20]
    const asPublic = body.subarray(21, 21 + idlen)
    const cipher = body.subarray(21 + idlen)
    const secret = ua.computeSecret(asPublic)
    const ikm = hkdf(auth, secret, Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), asPublic]), 32)
    const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16)
    const nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12)
    const d = createDecipheriv('aes-128-gcm', cek, nonce)
    d.setAuthTag(cipher.subarray(cipher.length - 16))
    const plain = Buffer.concat([d.update(cipher.subarray(0, cipher.length - 16)), d.final()])
    expect(plain[plain.length - 1]).toBe(2)
    expect(plain.subarray(0, plain.length - 1).toString()).toBe(msg)
  })

  it('assina o JWT VAPID com a chave privada', async () => {
    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
    const j = privateKey.export({ format: 'jwk' }) as { x: string; y: string; d: string }
    const pub = b64urlEncode(Buffer.concat([Buffer.from([4]), Buffer.from(j.x, 'base64url'), Buffer.from(j.y, 'base64url')]))
    const h = await vapidAuth('https://fcm.googleapis.com/fcm/send/xyz', { publicKey: pub, privateKey: j.d, subject: 'mailto:a@b.c' })
    const m = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(h)!
    expect(m[4]).toBe(pub)
    const claims = JSON.parse(Buffer.from(m[2], 'base64url').toString())
    expect(claims.aud).toBe('https://fcm.googleapis.com')
    expect(claims.sub).toBe('mailto:a@b.c')
    const ok = verify('sha256', Buffer.from(`${m[1]}.${m[2]}`), { key: createPublicKey(publicKey.export({ format: 'pem', type: 'spki' })), dsaEncoding: 'ieee-p1363' }, Buffer.from(m[3], 'base64url'))
    expect(ok).toBe(true)
  })
})
