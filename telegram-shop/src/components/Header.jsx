import React from 'react';
import { useCart } from '../context/CartContext';

const Header = ({ isAdmin, isAdminMode, onToggleAdmin, onAdminLogin }) => {
  const { getTotalItems, setIsCartOpen } = useCart();

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">
          {isAdminMode ? '⚙️ Управление' : '🛍 Магазин'}
        </h1>
      </div>

      <div className="header-right">
        {isAdmin && !isAdminMode && (
          <button 
            className="admin-btn"
            onClick={onToggleAdmin}
            title="Админ-панель"
          >
            ⚙️
          </button>
        )}

        {!isAdmin && !isAdminMode && (
          <button 
            className="admin-btn"
            onClick={onAdminLogin}
            title="Вход для администратора"
          >
            🔐
          </button>
        )}

        {!isAdminMode && (
          <button 
            className="cart-button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Корзина, ${getTotalItems()} товаров`}
          >
            <span>🛒</span>
            <span>Корзина</span>
            {getTotalItems() > 0 && (
              <span className="cart-badge">{getTotalItems()}</span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;