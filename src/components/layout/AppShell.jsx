import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Calendar, Users, Activity, Bell, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import styles from './AppShell.module.css'

const navItems = [
  { to: '/',             label: 'Agenda',      Icon: Calendar, exact: true },
  { to: '/pacientes',    label: 'Pacientes',   Icon: Users },
  { to: '/tratamentos',  label: 'Tratamentos', Icon: Activity },
  { to: '/notificacoes', label: 'Alertas',     Icon: Bell },
]

export default function AppShell() {
  const { clinic, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
      navigate('/login')
    } catch {
      toast.error('Erro ao sair. Tente novamente.')
    }
  }

  return (
    <div className={styles.shell}>

      {/* Barra superior — sempre visível */}
      <header className={styles.topbar}>
        <div>
          <p className={styles.topbarSub}>Bem-vindo</p>
          <h1 className={styles.topbarTitle}>{clinic?.name || 'Clínica'}</h1>
        </div>
        <button
          className={styles.logoutBtn}
          onClick={handleLogout}
          aria-label="Sair"
          title="Sair"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Corpo: sidebar (desktop) + conteúdo */}
      <div className={styles.body}>

        {/* Sidebar — só aparece em desktop via CSS */}
        <nav className={styles.sidebar}>
          {navItems.map(({ to, label, Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `${styles.sideNavItem} ${isActive ? styles.sideNavItemActive : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className={styles.sideNavLabel}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Conteúdo da página */}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>

      {/* Nav inferior — mobile e tablet, some em desktop via CSS */}
      <nav className={styles.bottomNav}>
        {navItems.map(({ to, label, Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className={styles.navLabel}>{label}</span>
                {isActive && <span className={styles.navDot} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

    </div>
  )
}
