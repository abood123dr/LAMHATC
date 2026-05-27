import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
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
import Login from '@/pages/Login';
import LinkTreeBuilder from '@/pages/LinkTreeBuilder';
import PublicLinkPage from '@/pages/PublicLinkPage';
import ReviewLinkGenerator from '@/pages/ReviewLinkGenerator';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/login" element={<Login />} />
            <Route path="/p/:username" element={<PublicLinkPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/movements" element={<Movements />} />
                <Route path="/quotes" element={<Quotes />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/discount-codes" element={<DiscountCodes />} />
                <Route path="/linktree" element={<LinkTreeBuilder />} />
                <Route path="/review-link" element={<ReviewLinkGenerator />} />
              </Route>
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
        <SonnerToaster position="top-center" dir="rtl" richColors />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
