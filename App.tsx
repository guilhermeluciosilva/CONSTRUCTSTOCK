
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Admin/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { RMList } from './pages/RM/RMList';
import { RMNew } from './pages/RM/RMNew';
import { RMDetail } from './pages/RM/RMDetail';
import { StockList } from './pages/Stock/StockList';
import { POList } from './pages/Purchases/POList';
import { DocumentCenter } from './pages/Documents/DocumentCenter';
import { UserManagement } from './pages/Admin/UserManagement';
import { MaterialManagement } from './pages/Admin/MaterialManagement';
import { OrgManagement } from './pages/Admin/OrgManagement';
import { SupplierManagement } from './pages/Admin/SupplierManagement';
import { MovementList } from './pages/Movements/MovementList';
import { TransferList } from './pages/Transfers/TransferList';
import { ReportCenter } from './pages/Reports/ReportCenter';
import { SalesList } from './pages/Sales/SalesList';
import { SalesEntry } from './pages/Sales/SalesEntry';
import { OperationSettings } from './pages/Admin/OperationSettings';
import { MENU_ITEMS } from './constants';
import { Permission } from './types';

const AppContent: React.FC = () => {
  const { user, loading, hasPermission } = useAuth();
  const { currentScope } = useApp();
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [selectedRMId, setSelectedRMId] = useState<string | null>(null);

  if (loading) return <div className="flex items-center justify-center h-screen"><i className="fas fa-sync fa-spin text-3xl text-blue-600"></i></div>;
  if (!user) {
    if (isOnboarding) return <Onboarding onBack={() => setIsOnboarding(false)} />;
    return <Login onOnboard={() => setIsOnboarding(true)} />;
  }

  const handleNavigate = (path: string) => {
    const menuItem = MENU_ITEMS.find(m => m.path === path);
    if (menuItem && !hasPermission(menuItem.minPermission as Permission, currentScope || undefined)) return;
    setCurrentPath(path);
  };

  const renderPage = () => {
    switch (currentPath) {
      case '/dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case '/sales': return <SalesList onNew={() => setCurrentPath('/sales/new')} />;
      case '/sales/new': return <SalesEntry onFinished={() => setCurrentPath('/sales')} />;
      case '/rm': return <RMList onDetail={(id) => { setSelectedRMId(id); setCurrentPath('/rm/detail'); }} onNew={() => setCurrentPath('/rm/new')} />;
      case '/rm/detail': return <RMDetail id={selectedRMId!} onBack={() => setCurrentPath('/rm')} />;
      case '/stock': return <StockList />;
      case '/movements': return <MovementList />;
      case '/transfers': return <TransferList onDetail={() => {}} onNew={() => {}} />;
      case '/purchases': return <POList onNew={() => {}} onDetail={() => {}} />;
      case '/documents': return <DocumentCenter />;
      case '/admin/users': return <UserManagement />;
      case '/admin/materials': return <MaterialManagement />;
      case '/admin/org': return <OrgManagement />;
      case '/admin/suppliers': return <SupplierManagement />;
      case '/admin/settings': return <OperationSettings />;
      case '/reports': return <ReportCenter />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return <Layout onNavigate={handleNavigate} currentPath={currentPath}>{renderPage()}</Layout>;
};

const App: React.FC = () => (
  <AuthProvider>
    <NotificationProvider>
      <AppProvider><AppContent /></AppProvider>
    </NotificationProvider>
  </AuthProvider>
);

export default App;
