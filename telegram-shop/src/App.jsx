import React, { useEffect, useState } from 'react'
import Header from './components/Header'
import ProductCard from './components/ProductCard'
import Cart from './components/Cart'
import AdminPanel from './components/AdminPanel'
import AdminLogin from './components/AdminLogin'
import { CartProvider } from './context/CartContext'
import { AdminProvider } from './context/AdminContext'
import { getProducts } from './services/api'
import './App.css'

function App() {
  const [products, setProducts] = useState([])
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadProducts()
    initTelegram()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await getProducts()
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading products:', error)
      setError('Ошибка загрузки товаров')
    } finally {
      setLoading(false)
    }
  }

  const initTelegram = () => {
    const telegram = window.Telegram?.WebApp
    if (telegram) {
      telegram.ready()
      telegram.expand()
      
      // Проверка админа
      const userId = telegram.initDataUnsafe?.user?.id
      if (userId) {
        const adminIds = JSON.parse(localStorage.getItem('adminIds') || '[]')
        setIsAdmin(adminIds.includes(userId))
      }
    } else {
      // Для тестирования в браузере
      const savedAdmin = localStorage.getItem('isAdmin') === 'true'
      setIsAdmin(savedAdmin)
    }
  }

  if (loading) {
    return <div className="app-loading">Загрузка...</div>
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>⚠️ {error}</h2>
        <button onClick={() => window.location.reload()}>Обновить</button>
      </div>
    )
  }

  return (
    <AdminProvider>
      <CartProvider>
        <div className="app">
          <Header 
            isAdmin={isAdmin}
            isAdminMode={isAdminMode}
            onToggleAdmin={() => setIsAdminMode(!isAdminMode)}
            onAdminLogin={() => {
              const password = prompt('Пароль администратора:')
              if (password === 'admin123') {
                setIsAdmin(true)
                setIsAdminMode(true)
                localStorage.setItem('isAdmin', 'true')
              }
            }}
          />

          {isAdminMode && isAdmin ? (
            <AdminPanel />
          ) : (
            <main className="products-grid">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </main>
          )}
          
          <Cart />
        </div>
      </CartProvider>
    </AdminProvider>
  )
}

export default App