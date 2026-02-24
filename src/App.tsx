import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useTitulosRealtime } from "@/hooks/useTitulosRealtime";

// Pages
import Auth from "./pages/Auth";
import SelecionarObra from "./pages/SelecionarObra";
import ObraDashboard from "./pages/obra/ObraDashboard";
import ObraTitulos from "./pages/obra/ObraTitulos";
import NovoTitulo from "./pages/obra/NovoTitulo";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTitulos from "./pages/admin/AdminTitulos";
import AdminAprovacoes from "./pages/admin/AdminAprovacoes";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminObras from "./pages/admin/AdminObras";
import AdminNovoTitulo from "./pages/admin/AdminNovoTitulo";
import OrcamentoObras from "./pages/orcamento/OrcamentoObras";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

// Protected route component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/selecionar-obra" replace />;
  }

  return <>{children}</>;
}

// Obra protected route - requires obra selection
function ObraProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, selectedObra, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role !== 'obra' && user.role !== 'orcamento') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!selectedObra) {
    return <Navigate to="/selecionar-obra" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  
  // Enable realtime subscriptions for titulos
  useTitulosRealtime();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/selecionar-obra'} replace /> : <Auth />} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      
      {/* Obra selection */}
      <Route path="/selecionar-obra" element={
        <ProtectedRoute allowedRoles={['obra', 'orcamento']}>
          <SelecionarObra />
        </ProtectedRoute>
      } />
      
      {/* Obra routes */}
      <Route path="/obra/dashboard" element={
        <ObraProtectedRoute>
          <ObraDashboard />
        </ObraProtectedRoute>
      } />
      <Route path="/obra/titulos" element={
        <ObraProtectedRoute>
          <ObraTitulos />
        </ObraProtectedRoute>
      } />
      <Route path="/obra/novo-titulo" element={
        <ObraProtectedRoute>
          <NovoTitulo />
        </ObraProtectedRoute>
      } />
      
      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/titulos" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminTitulos />
        </ProtectedRoute>
      } />
      <Route path="/admin/aprovacoes" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminAprovacoes />
        </ProtectedRoute>
      } />
      <Route path="/admin/usuarios" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminUsuarios />
        </ProtectedRoute>
      } />
      <Route path="/admin/obras" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminObras />
        </ProtectedRoute>
      } />
      <Route path="/admin/novo-titulo" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminNovoTitulo />
        </ProtectedRoute>
      } />
      
      {/* Orcamento routes */}
      <Route path="/orcamento/obras" element={
        <ProtectedRoute allowedRoles={['orcamento']}>
          <OrcamentoObras />
        </ProtectedRoute>
      } />
      
      {/* Redirect root to auth */}
      <Route path="/" element={<Navigate to="/auth" replace />} />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
