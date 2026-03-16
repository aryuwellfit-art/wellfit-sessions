import React from 'react';
import { createBrowserRouter, redirect } from 'react-router';
import Login from './pages/Login';
import AdminLayout from './components/layout/AdminLayout';
import TrainerLayout from './components/layout/TrainerLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import StoreManagement from './pages/admin/StoreManagement';
import TrainerManagement from './pages/admin/TrainerManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import ClientOverview from './pages/admin/ClientOverview';
import ExerciseManagement from './pages/admin/ExerciseManagement';
import MonthlyStats from './pages/admin/MonthlyStats';
import InactiveClientsPage from './pages/admin/InactiveClientsPage';
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import ClientList from './pages/trainer/ClientList';
import ClientDetail from './pages/trainer/ClientDetail';
import SessionForm from './pages/trainer/SessionForm';
import ClientForm from './pages/trainer/ClientForm';

// sessionStorage-based route guards (no data storage - just auth state)
function getSessionRole(): string | null {
  try { return sessionStorage.getItem('fitlab_role'); } catch { return null; }
}
function getSessionUid(): string | null {
  try { return sessionStorage.getItem('fitlab_uid'); } catch { return null; }
}

function requireAuth() {
  if (!getSessionUid()) return redirect('/');
  return null;
}

function requireAdminOrManager() {
  const uid = getSessionUid();
  const role = getSessionRole();
  if (!uid) return redirect('/');
  if (role !== 'admin' && role !== 'area_manager') return redirect('/trainer');
  return null;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    loader: requireAdminOrManager,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'stores', element: <StoreManagement /> },
      { path: 'trainers', element: <TrainerManagement /> },
      { path: 'payments', element: <PaymentManagement /> },
      { path: 'clients', element: <ClientOverview /> },
      { path: 'exercises', element: <ExerciseManagement /> },
      { path: 'stats', element: <MonthlyStats /> },
      { path: 'inactive', element: <InactiveClientsPage /> },
    ],
  },
  {
    path: '/trainer',
    element: <TrainerLayout />,
    loader: requireAuth,
    children: [
      { index: true, element: <TrainerDashboard /> },
      { path: 'clients', element: <ClientList /> },
      { path: 'clients/new', element: <ClientForm /> },
      { path: 'clients/:clientId', element: <ClientDetail /> },
      { path: 'clients/:clientId/session/new', element: <SessionForm /> },
    ],
  },
]);
