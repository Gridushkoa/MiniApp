import React, { useEffect, useState, useCallback } from 'react'
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
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight)
  const [showAdminLogin, setShowAdminLogin] = useState(false)

  // Инициализация приложения
  useEffect(() => {
    const init = async () => {
      try {
        await loadProducts()
        await initTelegram()
        updateViewportHeight()
        
        window.addEventListener('resize', updateViewportHeight)
        window.addEventListener('orientationchange', updateViewportHeight)
        
        return () => {
          window.removeEventListener('resize', updateViewportHeight)
          window.removeEventListener('orientationchange', updateViewportHeight)
        }
      } catch (error) {
        console.error('Initialization error:', error)
        setError('Ошибка загрузки приложения')
      } finally {
        setLoading(false)
      }
    }
    
    init()
  }, [])

  const updateViewportHeight = useCallback(() => {
    const height = window.innerHeight
    setViewportHeight(height)
    document.documentElement.style.setProperty('--vh', `${height * 0.01}px`)
  }, [])

  const loadProducts = async () => {
    try {
      const data = await getProducts()
      setProducts(data.filter(p => p.is_active !== false))
    } catch (error) {
      console.warn('Using local products data as fallback')
      const { products: localProducts } = await import('./data/products')
      setProducts(localProducts)
    }
  }

  const initTelegram = async () => {
    const telegram = window.Telegram?.WebApp
    
    if (!telegram) {
      console.log('Running outside Telegram')
      // Для тестирования в браузере
      const savedAdminMode = localStorage.getItem('isAdminMode') === 'true'
      setIsAdmin(savedAdminMode)
      if (savedAdminMode) setIsAdminMode(true)
      return
    }

    try {
      telegram.ready()
      telegram.expand()
      
      // Настройка цветовой схемы
      const themeParams = telegram.themeParams || {}
      document.documentElement.style.setProperty('--tg-theme-bg-color', telegram.backgroundColor || '#ffffff')
      document.documentElement.style.setProperty('--tg-theme-text-color', telegram.textColor || '#000000')
      document.documentElement.style.setProperty('--tg-theme-button-color', telegram.buttonColor || '#2481cc')
      document.documentElement.style.setProperty('--tg-theme-button-text-color', telegram.buttonTextColor || '#ffffff')
      document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || '#999999')
      document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color || '#2481cc')
      
      // Обработчик изменения темы
      telegram.onEvent('themeChanged', () => {
        document.documentElement.style.setProperty('--tg-theme-bg-color', telegram.backgroundColor)
        document.documentElement.style.setProperty('--tg-theme-text-color', telegram.textColor)
        document.documentElement.style.setProperty('--tg-theme-button-color', telegram.buttonColor)
        document.documentElement.style.setProperty('--tg-theme-button-text-color', telegram.buttonTextColor)
      })
      
      // Обработчик изменения viewport
      telegram.onEvent('viewportChanged', ({ isStateStable }) => {
        if (isStateStable) {
          updateViewportHeight()
        }
      })
      
      // Проверка прав администратора
      await checkAdminStatus()
      
      // Установка главной кнопки
      telegram.MainButton.setParams({
        text: 'Поделиться',
        color: '#2481cc',
        text_color: '#ffffff',
        is_visible: false
      })
      
    } catch (error) {
      console.error('Telegram initialization error:', error)
    }
  }

  const checkAdminStatus = async () => {
    try {
      const telegram = window.Telegram?.WebApp
      if (!telegram) return
      
      const userId = telegram.initDataUnsafe?.user?.id
      if (!userId) return
      
      // Проверяем в localStorage для быстрого доступа
      const adminIds = JSON.parse(localStorage.getItem('adminIds') || '[]')
      const isAdminUser = adminIds.includes(userId)
      
      setIsAdmin(isAdminUser)
      
      // Если админ, проверяем сохраненный режим
      if (isAdminUser) {
        const savedMode = localStorage.getItem('adminMode') === 'true'
        setIsAdminMode(savedMode)
      }
      
    } catch (error) {
      console.error('Admin check error:', error)
    }
  }

  const handleAdminLogin = (success) => {
    if (success) {
      setIsAdmin(true)
      setIsAdminMode(true)
      localStorage.setItem('adminMode', 'true')
      setShowAdminLogin(false)
    }
  }

  const toggleAdminMode = () => {
    const newMode = !isAdminMode
    setIsAdminMode(newMode)
    localStorage.setItem('adminMode', newMode.toString())
  }

  const handleProductsUpdate = useCallback((updatedProducts) => {
    setProducts(updatedProducts)
  }, [])

  // Экран загрузки
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка приложения...</p>
      </div>
    )
  }

  // Экран ошибки
  if (error) {
    return (
      <div className="app-error">
        <div className="error-icon">⚠️</div>
        <h2>Произошла ошибка</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="reload-btn">
          Перезагрузить
        </button>
      </div>
    )
  }

  return (
    <AdminProvider onProductsUpdate={handleProductsUpdate}>
      <CartProvider>
        <div className="app" style={{ minHeight: viewportHeight }}>
          <Header 
            isAdmin={isAdmin}
            isAdminMode={isAdminMode}
            onToggleAdmin={toggleAdminMode}
            onAdminLogin={() => setShowAdminLogin(true)}
          />

          {showAdminLogin && (
            <AdminLogin 
              onSuccess={() => handleAdminLogin(true)}
              onCancel={() => setShowAdminLogin(false)}
            />
          )}

          {isAdminMode && isAdmin ? (
            <div className="admin-section">
              <div className="admin-notification">
                <span>⚙️ Режим администратора</span>
                <button onClick={toggleAdminMode} className="exit-admin-btn">
                  Выйти
                </button>
              </div>
              <AdminPanel />
            </div>
          ) : (
            <>
              {products.length === 0 ? (
                <div className="empty-products">
                  <div className="empty-icon">📦</div>
                  <h3>Товаров пока нет</h3>
                  <p>Загляните позже или обратитесь к администратору</p>
                </div>
              ) : (
                <main className="products-grid">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </main>
              )}
            </>
          )}

          {!isAdminMode && <Cart />}
        </div>
      </CartProvider>
    </AdminProvider>
  )
}

export default App