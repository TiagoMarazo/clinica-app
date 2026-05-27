/**
 * Interface de envio de WhatsApp.
 *
 * Para trocar de provedor, mude apenas a linha de import abaixo.
 * O resto do código nunca precisa ser alterado.
 *
 * Opções disponíveis:
 *   ./console      — Fake para testes (não envia nada, só loga)
 *   ./zapi         — Z-API (requer Firebase Secrets: ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN)
 *   ./evolutionapi — Evolution API (requer Firebase Secrets: EVOLUTION_URL, EVOLUTION_INSTANCE, EVOLUTION_API_KEY)
 */

// ─── TROQUE AQUI PARA MUDAR O PROVEDOR ───────────────────────────────────────
const provider = require('./console')   // ← modo teste: não envia mensagens reais
// const provider = require('./zapi')   // ← produção com Z-API
// const provider = require('./evolutionapi') // ← produção com Evolution API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Envia uma mensagem de WhatsApp.
 * @param {object} params
 * @param {string} params.to      - Número do destinatário (somente dígitos ou formatado)
 * @param {string} params.message - Texto da mensagem
 */
async function send({ to, message }) {
  return provider.send({ to, message })
}

module.exports = { send }
