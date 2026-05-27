// Páginas temporárias — serão substituídas pelos arquivos completos
// Existem apenas para o app não quebrar enquanto o código é gerado

const Placeholder = ({ title }) => (
  <div style={{
    padding: '32px 20px',
    textAlign: 'center',
    color: 'var(--color-text-secondary)',
    fontFamily: 'var(--font)',
  }}>
    <div style={{ fontSize: 32, marginBottom: 12 }}>🔧</div>
    <h2 style={{ color: 'var(--color-text)', marginBottom: 6 }}>{title}</h2>
    <p style={{ fontSize: 14 }}>Em construção…</p>
  </div>
)

export const AgendaPage          = () => <Placeholder title="Agenda" />
export const AppointmentFormPage = () => <Placeholder title="Nova Consulta" />
export const PatientsPage        = () => <Placeholder title="Pacientes" />
export const PatientDetailPage   = () => <Placeholder title="Paciente" />
export const PatientFormPage     = () => <Placeholder title="Cadastro de Paciente" />
export const TreatmentsPage      = () => <Placeholder title="Tratamentos" />
export const TreatmentDetailPage = () => <Placeholder title="Tratamento" />
export const NotificationsPage   = () => <Placeholder title="Notificações" />
