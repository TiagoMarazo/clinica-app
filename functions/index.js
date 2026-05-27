const { onSchedule }   = require('firebase-functions/v2/scheduler')
const { onRequest }    = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { runDailyReminders } = require('./src/scheduler')

initializeApp()

/**
 * Disparo automático — roda todo dia às 8h no horário de Brasília.
 * Expressão cron: minuto hora * * *
 */
exports.dailyReminder = onSchedule(
  {
    schedule:  '0 8 * * *',      // Todo dia às 08:00
    timeZone:  'America/Sao_Paulo',
    region:    'southamerica-east1',
    memory:    '256MiB',
  },
  async (event) => {
    console.log('[dailyReminder] Iniciando disparo automático...')
    await runDailyReminders()
  }
)

/**
 * Disparo manual via HTTP — para testar sem esperar as 8h.
 * Acesse a URL da função no console do Firebase para disparar manualmente.
 *
 * ATENÇÃO: em produção, proteja essa rota ou remova-a.
 */
exports.triggerReminderManual = onRequest(
  {
    region: 'southamerica-east1',
    memory: '256MiB',
  },
  async (req, res) => {
    console.log('[triggerReminderManual] Disparo manual iniciado...')
    try {
      const result = await runDailyReminders()
      res.json({ ok: true, ...result })
    } catch (err) {
      console.error('[triggerReminderManual] Erro:', err)
      res.status(500).json({ ok: false, error: err.message })
    }
  }
)
