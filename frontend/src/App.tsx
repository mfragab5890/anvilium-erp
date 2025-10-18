import * as React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Shell + static pages you already have
import Dashboard from './pages/Dashboard'
import DashboardHome from './pages/home/DashboardHome'
import FuturisticHome from './pages/home/FuturisticHome'
import ModulesHub from './pages/home/ModulesHub'
import Login from './pages/Login'

// NEW: dynamic loader
import DynamicPage from './router/Dynamic'

// NEW: modules provider
import { ModulesProvider } from './store/modules'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />

        {/* App shell (keeps your TopBar/SideNav/theme exactly as-is) */}
        <Route
          path="/app"
          element={
            <ModulesProvider>
              <Dashboard />
            </ModulesProvider>
          }
        >
          {/* Default dashboard */}
          <Route index element={<DashboardHome />} />

          {/* Optional static entries you already use */}
          <Route path="home" element={<DashboardHome />} />
          <Route path="futuristic" element={<FuturisticHome />} />
          <Route path="modules" element={<ModulesHub />} />

          {/* Dynamic: modules -> tabs -> sections */}
          <Route path=":module" element={<DynamicPage />} />
          <Route path=":module/:tab" element={<DynamicPage />} />
          <Route path=":module/:tab/:section" element={<DynamicPage />} />
        </Route>

        {/* Root -> app */}
        <Route path="/" element={<Navigate to="/app" replace />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
