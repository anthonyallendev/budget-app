import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WaveBackground from './components/WaveBackground'
import LandingPage from './pages/LandingPage'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import BudgetTargetsPage from './pages/BudgetTargetsPage'
import BudgetLimitsPage from './pages/BudgetLimitsPage'
import RetirementPage from './pages/RetirementPage'
import UpgradePage from './pages/UpgradePage'
import InvestmentStrategiesPage from './pages/InvestmentStrategiesPage'
import TaxEstimatePage from './pages/TaxEstimatePage'
import DebtPayoffPage from './pages/DebtPayoffPage'
import SavingsGoalsPage from './pages/SavingsGoalsPage'
import NetWorthPage from './pages/NetWorthPage'
import BillsPage from './pages/BillsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ReportsPage from './pages/ReportsPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import PrivateRoute from './components/PrivateRoute'

function Private({ children }) {
  return <PrivateRoute>{children}</PrivateRoute>
}

export default function App() {
  return (
    <BrowserRouter>
      <WaveBackground />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/onboarding"     element={<Private><OnboardingPage /></Private>} />
        <Route path="/dashboard"      element={<Private><DashboardPage /></Private>} />
        <Route path="/transactions"   element={<Private><TransactionsPage /></Private>} />
        <Route path="/budget-targets" element={<Private><BudgetTargetsPage /></Private>} />
        <Route path="/budget-limits"  element={<Private><BudgetLimitsPage /></Private>} />
        <Route path="/retirement"     element={<Private><RetirementPage /></Private>} />
        <Route path="/upgrade"        element={<Private><UpgradePage /></Private>} />
        <Route path="/investing"      element={<Private><InvestmentStrategiesPage /></Private>} />
        <Route path="/tax"            element={<Private><TaxEstimatePage /></Private>} />
        <Route path="/debt"           element={<Private><DebtPayoffPage /></Private>} />
        <Route path="/savings-goals"  element={<Private><SavingsGoalsPage /></Private>} />
        <Route path="/net-worth"      element={<Private><NetWorthPage /></Private>} />
        <Route path="/bills"          element={<Private><BillsPage /></Private>} />
        <Route path="/leaderboard"    element={<Private><LeaderboardPage /></Private>} />
        <Route path="/reports"        element={<Private><ReportsPage /></Private>} />
        <Route path="/privacy"        element={<PrivacyPolicyPage />} />
      </Routes>
    </BrowserRouter>
  )
}
