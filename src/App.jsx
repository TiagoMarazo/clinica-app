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
import AgendaPage          from './pages/agenda/AgendaPage'
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

// Rota protegida — exige login E e-mail verificado
function PrivateRoute({ children }) {
  const { user, emailVerified } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!emailVerified) return <Navigate to="/verificar-email" replace />
  return children
}

// Rota pública — redireciona para agenda se já logado e verificado
function PublicRoute({ children }) {
  const { user, emailVerified } = useAuth()
  if (user && emailVerified) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/cadastro"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/recuperar-senha" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

        {/* Verificação de e-mail — acessível para logados não verificados */}
        <Route path="/verificar-email" element={<VerifyEmailPage />} />

        {/* Rotas protegidas — exigem login E verificação */}
        <Route path="/" element={<PrivateRoute><AppShell /></PrivateRoute>}>
          <Route index                       element={<AgendaPage />} />
          <Route path="consulta/nova"        element={<AppointmentFormPage />} />
          <Route path="consulta/:id/editar"  element={<AppointmentFormPage />} />

          <Route path="pacientes"            element={<PatientsPage />} />
          <Route path="pacientes/novo"       element={<PatientFormPage />} />
          <Route path="pacientes/:id"        element={<PatientDetailPage />} />
          <Route path="pacientes/:id/editar" element={<PatientFormPage />} />

          <Route path="tratamentos"          element={<TreatmentsPage />} />
          <Route path="tratamentos/novo"     element={<TreatmentDetailPage />} />
          <Route path="tratamentos/:id"      element={<TreatmentDetailPage />} />

          <Route path="notificacoes"         element={<NotificationsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
