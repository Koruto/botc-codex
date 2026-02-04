import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ServerPage } from './pages/ServerPage'
import { GamePage } from './pages/GamePage'
import { AddGamePage } from './pages/AddGamePage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="server/:serverId" element={<ServerPage />} />
          <Route path="game/:gameId" element={<GamePage />} />
          <Route path="server/:serverId/add-game" element={<AddGamePage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
