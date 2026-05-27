/**
 * Provedor Evolution API (open source)
 * Documentação: https://doc.evolution-api.com
 *
 * Variáveis de ambiente necessárias (Firebase Secrets):
 *   EVOLUTION_URL       — URL da sua instância hospedada ex: https://sua-api.railway.app
 *   EVOLUTION_INSTANCE  — Nome da instância criada no painel
 *   EVOLUTION_API_KEY   — API Key de autenticação
 */

const fetch = require('node-fetch')

async function send({ to, message }) {
  const baseUrl    = process.env.EVOLUTION_URL
  const instance   = process.env.EVOLUTION_INSTANCE
  const apiKey     = process.env.EVOLUTION_API_KEY

  if (!baseUrl || !instance || !apiKey) {
    throw new Error('Evolution API: credenciais não configuradas. Verifique os Firebase Secrets.')
  }

  const digits = to.replace(/\D/g, '')
  const phone  = digits.startsWith('55') ? digits : `55${digits}`

  const url  = `${baseUrl}/message/sendText/${instance}`
  const body = {
    number:  phone,
    text:    message,
    delay:   0,
  }

  const response = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey':       apiKey,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Evolution API erro ${response.status}: ${error}`)
  }

  const result = await response.json()
  return { success: true, result }
}

module.exports = { send }
