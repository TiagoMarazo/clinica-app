const { getFirestore, Timestamp } = require('firebase-admin/firestore')
const whatsapp                    = require('./providers/whatsapp')
const { buildReminderMessage }    = require('./message')

/**
 * Busca todas as consultas de amanhã com telefone cadastrado
 * e envia lembrete via WhatsApp para cada uma.
 * Marca reminderSent: true após envio bem-sucedido.
 */
async function runDailyReminders() {
  const db = getFirestore()

  // Intervalo de amanhã: 00:00:00 até 23:59:59
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const dayAfter = new Date(tomorrow)
  dayAfter.setHours(23, 59, 59, 999)

  console.log(`[Scheduler] Buscando consultas de ${tomorrow.toLocaleDateString('pt-BR')}`)

  // Busca todas as clínicas
  const clinicsSnap = await db.collection('clinics').get()

  let totalSent   = 0
  let totalFailed = 0

  for (const clinicDoc of clinicsSnap.docs) {
    const clinic   = { id: clinicDoc.id, ...clinicDoc.data() }
    const clinicName = clinic.name || 'Clínica'

    // Busca consultas de amanhã dessa clínica que ainda não tiveram lembrete enviado
    const apptSnap = await db
      .collection('clinics')
      .doc(clinic.id)
      .collection('appointments')
      .where('dateTime', '>=', Timestamp.fromDate(tomorrow))
      .where('dateTime', '<=', Timestamp.fromDate(dayAfter))
      .where('status', '==', 'scheduled')
      .where('reminderSent', '==', false)
      .get()

    console.log(`[Scheduler] Clínica "${clinicName}": ${apptSnap.size} consulta(s) para lembrete`)

    for (const apptDoc of apptSnap.docs) {
      const appt = apptDoc.data()

      // Pula se não tiver telefone
      if (!appt.patientPhone) {
        console.log(`[Scheduler] Sem telefone — pulando ${appt.patientName}`)
        continue
      }

      // Formata data e hora para o texto da mensagem
      const dt   = appt.dateTime.toDate()
      const date = dt.toLocaleDateString('pt-BR')
      const time = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

      const message = buildReminderMessage({
        patientName: appt.patientName,
        clinicName,
        date,
        time,
      })

      try {
        const result = await whatsapp.send({
          to:      appt.patientPhone,
          message,
        })

        // Marca como enviado no Firestore
        await apptDoc.ref.update({
          reminderSent:   true,
          reminderSentAt: Timestamp.now(),
        })

        console.log(`[Scheduler] ✓ Lembrete enviado para ${appt.patientName} (${appt.patientPhone})`)
        if (result.simulated) console.log('[Scheduler] (simulado — nenhuma mensagem real enviada)')
        totalSent++

      } catch (err) {
        // Falha no envio — não marca como enviado, vai tentar novamente no próximo dia
        console.error(`[Scheduler] ✗ Falha ao enviar para ${appt.patientName}:`, err.message)
        totalFailed++
      }
    }
  }

  console.log(`[Scheduler] Concluído — ${totalSent} enviados, ${totalFailed} falhas`)
  return { totalSent, totalFailed }
}

module.exports = { runDailyReminders }
