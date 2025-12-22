
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Admin/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { RMList } from './pages/RM/RMList';
import { RMNew } from './pages/RM/RMNew';
import { RMDetail } from './pages/RM/RMDetail';
import { StockList } from './pages/Stock/StockList';
import { POList } from './pages/Purchases/POList';
import { PONew } from './pages/Purchases/PONew';
import { PODetail } from './pages/Purchases/PODetail';
import { DocumentCenter } from './pages/Documents/DocumentCenter';
import { UserManagement } from './pages/Admin/UserManagement';
import { MaterialManagement } from './pages/Admin/MaterialManagement';
import { OrgManagement } from './pages/Admin/OrgManagement';
import { SupplierManagement } from './pages/Admin/SupplierManagement';
import { MovementList } from './pages/Movements/MovementList';
import { TransferList } from './pages/Transfers/TransferList';
import { TransferNew } from './pages/Transfers/TransferNew';
import { TransferDetail } from './pages/Transfers/TransferDetail';
import { ReportCenter } from './pages/Reports/ReportCenter';
import { SalesList } from './pages/Sales/SalesList';
import { SalesEntry } from './pages/Sales/SalesEntry';
import { TableManagement } from './pages/Restaurant/TableManagement';
import { OperationSettings } from './pages/Admin/OperationSettings';
import { CSVImport } from './pages/Admin/CSVImport';
import { NotificationProvider } from './contexts/NotificationContext';
import { MENU_ITEMS } from './constants';
import { Permission } from './types';

type AuthView = 'landing' | 'login' | 'onboarding';

const AppContent: React.FC = () => {
  const { user, loading, hasPermission } = useAuth();
  const { currentScope } = useApp();
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [authView, setAuthView] = useState<AuthView>('landing');
  
  const [selectedRMId, setSelectedRMId] = useState<string | null>(null);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);

  // Efeito para limpar estados de navegação ao deslogar
  useEffect(() => {
    if (!user) {
      setCurrentPath('/dashboard');
      setSelectedRMId(null);
      setSelectedTransferId(null);
      setSelectedPOId(null);
      setAuthView('landing');
    }
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-screen"><i className="fas fa-sync fa-spin text-3xl text-blue-600"></i></div>;
  
  if (!user) {
    if (authView === 'onboarding') return <Onboarding onBack={() => setAuthView('login')} />;
    if (authView === 'login') return <Login onBack={() => setAuthView('landing')} onOnboard={() => setAuthView('onboarding')} />;
    return <Landing onLogin={() => setAuthView('login')} onOnboard={() => setAuthView('onboarding')} />;
  }

  const handleNavigate = (path: string) => {
    const menuItem = MENU_ITEMS.find(m => m.path === path);
    if (menuItem && !hasPermission(menuItem.minPermission as Permission, currentScope || undefined)) return;
    setCurrentPath(path);
  };

  const renderPage = () => {
    switch (currentPath) {
      case '/dashboard': return <Dashboard onNavigate={handleNavigate} onSelectRM={(id) => { setSelectedRMId(id); setCurrentPath('/rm/detail'); }} />;
      case '/sales': return <SalesList onNew={() => setCurrentPath('/sales/new')} />;
      case '/sales/new': return <SalesEntry onFinished={() => setCurrentPath('/sales')} />;
      case '/tables': return <TableManagement />;
      case '/rm': return <RMList onDetail={(id) => { setSelectedRMId(id); setCurrentPath('/rm/detail'); }} onNew={() => setCurrentPath('/rm/new')} />;
      case '/rm/detail': return <RMDetail id={selectedRMId!} onBack={() => setCurrentPath('/rm')} onEdit={(id) => { setSelectedRMId(id); setCurrentPath('/rm/new'); }} />;
      case '/rm/new': return <RMNew editId={selectedRMId || undefined} onFinished={() => { setSelectedRMId(null); setCurrentPath('/rm'); }} />;
      case '/stock': return <StockList />;
      case '/movements': return <MovementList />;
      case '/transfers': return <TransferList onNew={() => setCurrentPath('/transfers/new')} onDetail={(id) => { setSelectedTransferId(id); setCurrentPath('/transfers/detail'); }} />;
      case '/transfers/new': return <TransferNew onFinished={() => setCurrentPath('/transfers')} />;
      case '/transfers/detail': return <TransferDetail id={selectedTransferId!} onBack={() => setCurrentPath('/transfers')} />;
      case '/purchases': return <POList onNew={() => setCurrentPath('/purchases/new')} onDetail={(id) => { setSelectedPOId(id); setCurrentPath('/purchases/detail'); }} />;
      case '/purchases/new': return <PONew onFinished={() => setCurrentPath('/purchases')} />;
      case '/purchases/detail': return <PODetail id={selectedPOId!} onBack={() => setCurrentPath('/purchases')} />;
      case '/documents': return <DocumentCenter />;
      case '/admin/users': return <UserManagement />;
      case '/admin/materials': return <MaterialManagement />;
      case '/admin/org': return <OrgManagement />;
      case '/admin/suppliers': return <SupplierManagement />;
      case '/admin/settings': return <OperationSettings />;
      case '/admin/import': return <CSVImport />;
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
