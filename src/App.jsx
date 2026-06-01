import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Autenticação
import LoginPage          from './pages/auth/LoginPage'
import RegisterPage       from './pages/auth/RegisterPage'
import VerifyEmailPage    from './pages/auth/VerifyEmailPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// Layout
import AppShell from './components/layout/AppShell'

// Agenda
import AgendaPage from './pages/agenda/AgendaPage'
import AppointmentFormPage from './pages/agenda/AppointmentFormPage'

// Pacientes
import PatientsPage      from './pages/patients/PatientsPage'
import PatientDetailPage from './pages/patients/PatientDetailPage'
import PatientFormPage   from './pages/patients/PatientFormPage'

// Tratamentos
import TreatmentsPage      from './pages/treatments/TreatmentsPage'
import TreatmentDetailPage from './pages/treatments/TreatmentDetailPage'

// Notificações
import NotificationsPage from './pages/notifications/NotificationsPage'

// Guard — redireciona para login se não estiver autenticado
function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

// Guard — redireciona para agenda se já estiver logado
function PublicRoute({ children }) {
  const { user } = useAuth()
  return !user ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/cadastro" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Rotas protegidas — dentro do AppShell (com navegação) */}
        <Route path="/" element={<PrivateRoute><AppShell /></PrivateRoute>}>
          <Route index element={<AgendaPage />} />
          <Route path="consulta/nova" element={<AppointmentFormPage />} />
          <Route path="consulta/:id/editar" element={<AppointmentFormPage />} />

          <Route path="pacientes" element={<PatientsPage />} />
          <Route path="pacientes/novo" element={<PatientFormPage />} />
          <Route path="pacientes/:id" element={<PatientDetailPage />} />
          <Route path="pacientes/:id/editar" element={<PatientFormPage />} />

          <Route path="tratamentos" element={<TreatmentsPage />} />
          <Route path="tratamentos/:id" element={<TreatmentDetailPage />} />

          <Route path="notificacoes" element={<NotificationsPage />} />
        </Route>

        {/* Qualquer rota desconhecida vai para a agenda */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
