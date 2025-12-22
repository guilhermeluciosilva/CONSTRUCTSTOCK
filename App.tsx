
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Admin/Onboarding';

// COMMON
import { Dashboard } from './pages/Common/Dashboard';
import { StockList } from './pages/Stock/StockList';
import { MovementList } from './pages/Movements/MovementList';
import { DocumentCenter } from './pages/Common/DocumentCenter';
import { ReportCenter } from './pages/Common/ReportCenter';

// RESTAURANTE
import { Tables } from './pages/Restaurant/Tables';
import { Menu } from './pages/Restaurant/Menu';
import { Recipes } from './pages/Restaurant/Recipes';

// STORE
import { SalesList } from './pages/Sales/SalesList';
import { SalesEntry } from './pages/Sales/SalesEntry';

// OPERATIONAL (CONSTRUCTION / FACTORY)
import { RMList } from './pages/Construction/RMList';
import { RMNew } from './pages/Construction/RMNew';
import { RMDetail } from './pages/Construction/RMDetail';
import { POList } from './pages/Construction/POList';
import { PONew } from './pages/Construction/PONew';
import { PODetail } from './pages/Construction/PODetail';
import { TransferList } from './pages/Construction/TransferList';
import { TransferNew } from './pages/Construction/TransferNew';
import { TransferDetail } from './pages/Construction/TransferDetail';

// ADMIN
import { UserManagement } from './pages/Admin/UserManagement';
import { MaterialManagement } from './pages/Admin/MaterialManagement';
import { OrgManagement } from './pages/Admin/OrgManagement';
import { SupplierManagement } from './pages/Admin/SupplierManagement';
import { OperationSettings } from './pages/Admin/OperationSettings';
import { CSVImport } from './pages/Admin/CSVImport';
import { NotificationProvider } from './contexts/NotificationContext';

type AuthView = 'landing' | 'login' | 'onboarding';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [authView, setAuthView] = useState<AuthView>('landing');
  
  const [selectedRMId, setSelectedRMId] = useState<string | null>(null);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);

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
    setCurrentPath(path);
  };

  const renderPage = () => {
    switch (currentPath) {
      case '/dashboard': return <Dashboard onNavigate={handleNavigate} />;
      
      // LOJA
      case '/sales': return <SalesList onNew={() => setCurrentPath('/sales/new')} />;
      case '/sales/new': return <SalesEntry onFinished={() => setCurrentPath('/sales')} />;
      
      // RESTAURANTE
      case '/restaurant/tables': return <Tables />;
      case '/restaurant/menu': return <Menu />;
      case '/restaurant/recipes': return <Recipes />;

      // OBRA / OPERACIONAL
      case '/rm': return <RMList onDetail={(id) => { setSelectedRMId(id); setCurrentPath('/rm/detail'); }} onNew={() => setCurrentPath('/rm/new')} />;
      case '/rm/detail': return <RMDetail id={selectedRMId!} onBack={() => setCurrentPath('/rm')} onEdit={(id) => { setSelectedRMId(id); setCurrentPath('/rm/new'); }} />;
      case '/rm/new': return <RMNew editId={selectedRMId || undefined} onFinished={() => { setSelectedRMId(null); setCurrentPath('/rm'); }} />;
      case '/transfers': return <TransferList onNew={() => setCurrentPath('/transfers/new')} onDetail={(id) => { setSelectedTransferId(id); setCurrentPath('/transfers/detail'); }} />;
      case '/transfers/new': return <TransferNew onFinished={() => setCurrentPath('/transfers')} />;
      case '/transfers/detail': return <TransferDetail id={selectedTransferId!} onBack={() => setCurrentPath('/transfers')} />;
      case '/purchases': return <POList onNew={() => setCurrentPath('/purchases/new')} onDetail={(id) => { setSelectedPOId(id); setCurrentPath('/purchases/detail'); }} />;
      case '/purchases/new': return <PONew onFinished={() => setCurrentPath('/purchases')} />;
      case '/purchases/detail': return <PODetail id={selectedPOId!} onBack={() => setCurrentPath('/purchases')} />;

      // COMPARTILHADO
      case '/stock': return <StockList />;
      case '/movements': return <MovementList />;
      case '/documents': return <DocumentCenter />;
      case '/reports': return <ReportCenter />;

      // ADMIN
      case '/admin/users': return <UserManagement />;
      case '/admin/materials': return <MaterialManagement />;
      case '/admin/org': return <OrgManagement />;
      case '/admin/suppliers': return <SupplierManagement />;
      case '/admin/settings': return <OperationSettings />;
      case '/admin/import': return <CSVImport />;
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
