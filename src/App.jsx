import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { CartProvider } from './context/CartContext'
import { ProductsProvider } from './context/ProductsContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Cart from './components/Cart'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import About from './pages/About'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import Checkout from './pages/Checkout'
import PedidoStatus from './pages/PedidoStatus'
import Config from './pages/Config'
import Dash from './pages/Dash'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function StoreLayout({ children }) {
  return (
    <>
      <Header />
      <Cart />
      {children}
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <ProductsProvider>
      <CartProvider>
        <ScrollToTop />
        <Routes>
          {/* Admin routes — sem header/footer da loja */}
          <Route path="/config"      element={<Config />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/dash" element={<Dash />} />

          {/* Store routes */}
          <Route path="/" element={<StoreLayout><Home /></StoreLayout>} />
          <Route path="/produtos" element={<StoreLayout><Products /></StoreLayout>} />
          <Route path="/produto/:id" element={<StoreLayout><ProductDetail /></StoreLayout>} />
          <Route path="/sobre" element={<StoreLayout><About /></StoreLayout>} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedido"   element={<StoreLayout><PedidoStatus /></StoreLayout>} />
        </Routes>
      </CartProvider>
    </ProductsProvider>
  )
}
