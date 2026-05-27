/**
 * Monta o texto do lembrete enviado ao paciente.
 * Edite aqui para mudar o formato da mensagem sem tocar na lógica de envio.
 *
 * @param {object} params
 * @param {string} params.patientName   - Nome do paciente
 * @param {string} params.clinicName    - Nome da clínica
 * @param {string} params.date          - Data formatada ex: "15/05/2025"
 * @param {string} params.time          - Horário formatado ex: "09:30"
 * @returns {string} Texto da mensagem
 */
function buildReminderMessage({ patientName, clinicName, date, time }) {
  const firstName = patientName.split(' ')[0]
  return (
    `Olá, ${firstName}! 👋\n\n` +
    `A *${clinicName}* lembra que você tem uma consulta agendada para *amanhã*:\n\n` +
    `📅 Data: *${date}*\n` +
    `🕐 Horário: *${time}*\n\n` +
    `Em caso de dúvidas ou para remarcar, entre em contato conosco.\n\n` +
    `_Este é um lembrete automático. Não responda esta mensagem._`
  )
}

module.exports = { buildReminderMessage }
