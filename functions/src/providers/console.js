/**
 * Provedor de WhatsApp para TESTES.
 * Não envia nenhuma mensagem real — apenas loga no console do Firebase.
 * Use este provedor durante desenvolvimento para testar o fluxo completo
 * sem precisar de conta em nenhum serviço externo.
 *
 * Para ativar: em whatsapp.js, importe este arquivo no lugar do provedor real.
 */

async function send({ to, message }) {
  console.log('──────────────────────────────────────')
  console.log('[WhatsApp SIMULADO] Mensagem que seria enviada:')
  console.log(`Para: ${to}`)
  console.log(`Texto:\n${message}`)
  console.log('──────────────────────────────────────')
  // Simula sucesso
  return { success: true, simulated: true }
}

module.exports = { send }
