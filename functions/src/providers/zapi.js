/**
 * Provedor Z-API
 * Documentação: https://developer.z-api.io
 *
 * Variáveis de ambiente necessárias (Firebase Secrets):
 *   ZAPI_INSTANCE_ID   — ID da instância Z-API
 *   ZAPI_TOKEN         — Token da instância
 *   ZAPI_CLIENT_TOKEN  — Client-Token de segurança
 */

const fetch = require('node-fetch')

async function send({ to, message }) {
  const instanceId    = process.env.ZAPI_INSTANCE_ID
  const token         = process.env.ZAPI_TOKEN
  const clientToken   = process.env.ZAPI_CLIENT_TOKEN

  if (!instanceId || !token || !clientToken) {
    throw new Error('Z-API: credenciais não configuradas. Verifique os Firebase Secrets.')
  }

  // Remove tudo que não for número e garante código do Brasil
  const digits = to.replace(/\D/g, '')
  const phone  = digits.startsWith('55') ? digits : `55${digits}`

  const url  = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`
  const body = { phone, message }

  const response = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Client-Token':  clientToken,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Z-API erro ${response.status}: ${error}`)
  }

  const result = await response.json()
  return { success: true, result }
}

module.exports = { send }
