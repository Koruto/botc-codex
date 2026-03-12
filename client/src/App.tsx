import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LandingPage } from './pages/LandingPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ServerPage } from './pages/ServerPage'
import { GamePage } from './pages/GamePage'
import { AddGamePage } from './pages/AddGamePage'
import { ProfilePage } from './pages/ProfilePage'
import { InvitePage } from './pages/InvitePage'
import { MyGamesPage } from './pages/MyGamesPage'
import { UserPublicPage } from './pages/UserPublicPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/game/:gameId" element={<GamePage />} />
          <Route path="/demo" element={<GamePage />} />

          <Route path="/">
            <Route index element={<LandingPage />} />

            <Route path="*" element={<Layout />}>
              {/* Public routes */}
              <Route path="login" element={<LoginPage />} />
              <Route path="servers/:serverId" element={<ServerPage />} />
              <Route path="invite/:inviteCode" element={<InvitePage />} />
              <Route path="user/:username" element={<UserPublicPage />} />

              {/* Protected routes */}
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="me/games"
                element={
                  <ProtectedRoute>
                    <MyGamesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="add-game"
                element={
                  <ProtectedRoute>
                    <AddGamePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="servers/:serverId/add-game"
                element={
                  <ProtectedRoute>
                    <AddGamePage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Route>
        </Routes>
        <Analytics />
        <SpeedInsights />
      </AuthProvider>
    </BrowserRouter>
  )
}
