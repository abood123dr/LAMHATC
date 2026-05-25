import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Sales from '@/pages/Sales';
import Customers from '@/pages/Customers';
import Gallery from '@/pages/Gallery';
import Movements from '@/pages/Movements';
import Quotes from '@/pages/Quotes';
import Orders from '@/pages/Orders';
import DiscountCodes from '@/pages/DiscountCodes';
import Menu from '@/pages/Menu';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/movements" element={<Movements />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/discount-codes" element={<DiscountCodes />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/menu" element={<Menu />} />

            <Route path="*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
        <SonnerToaster position="top-center" dir="rtl" richColors />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App