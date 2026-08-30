import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import GroupDetailPage from './pages/admin/GroupDetailPage'
import InstitutionDetailPage from './pages/admin/InstitutionDetailPage'
import InstitutionsPage from './pages/admin/InstitutionsPage'
import AdminMaterialsPage from './pages/admin/MaterialsPage'
import MissionaryProfilePage from './pages/admin/MissionaryProfilePage'
import MyGroupsPage from './pages/admin/MyGroupsPage'
import WebhookPage from './pages/admin/WebhookPage'
import Home from './pages/Home'
import InviteAccept from './pages/InviteAccept'
import Login from './pages/Login'
import MaterialsPage from './pages/MaterialsPage'
import NotFound from './pages/NotFound'
import ProfilePage from './pages/ProfilePage'
import QuestPage from './pages/QuestPage'
import {
  RequireInstitutionAccess,
  RequireInstitutionOrLeaderAccess,
  RequireSuperAdmin,
} from './routes/AdminRoute'
import ProtectedRoute from './routes/ProtectedRoute'

import { DashboardLayout } from './components/layout/DashboardLayout'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/invite/:token" element={<InviteAccept />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/home" element={<Home />} />
          <Route path="/quest" element={<QuestPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-groups" element={<MyGroupsPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route
            path="/admin/institutions/:institutionId/materials"
            element={
              <RequireInstitutionOrLeaderAccess>
                <AdminMaterialsPage />
              </RequireInstitutionOrLeaderAccess>
            }
          />
          <Route
            path="/admin/institutions"
            element={
              <RequireSuperAdmin>
                <InstitutionsPage />
              </RequireSuperAdmin>
            }
          />
          <Route
            path="/admin/institutions/:institutionId"
            element={
              <RequireInstitutionAccess>
                <InstitutionDetailPage />
              </RequireInstitutionAccess>
            }
          />
          <Route
            path="/admin/institutions/:institutionId/groups/:groupId"
            element={
              <RequireInstitutionOrLeaderAccess>
                <GroupDetailPage />
              </RequireInstitutionOrLeaderAccess>
            }
          />
          <Route
            path="/admin/institutions/:institutionId/missionaries/:missionaryId"
            element={
              <RequireInstitutionOrLeaderAccess>
                <MissionaryProfilePage />
              </RequireInstitutionOrLeaderAccess>
            }
          />
          <Route
            path="/admin/webhook"
            element={
              <RequireSuperAdmin>
                <WebhookPage />
              </RequireSuperAdmin>
            }
          />
        </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
