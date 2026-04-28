import React, { useState, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import CartItem from './CartItem';
import Checkout from './Checkout';

const Cart = () => {
  const { 
    cartItems, 
    isCartOpen, 
    setIsCartOpen, 
    getTotalPrice, 
    getTotalItems, 
    clearCart 
  } = useCart();
  
  const [showCheckout, setShowCheckout] = useState(false);

  const handleClose = useCallback(() => {
    setIsCartOpen(false);
    setShowCheckout(false);
  }, [setIsCartOpen]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  if (!isCartOpen) return null;

  if (showCheckout) {
    return <Checkout onBack={() => setShowCheckout(false)} />;
  }

  return (
    <div className="cart-overlay" onClick={handleBackdropClick}>
      <div className="cart-panel">
        <div className="cart-header">
          <h2>Корзина ({getTotalItems()})</h2>
          <button 
            className="close-btn" 
            onClick={handleClose}
            aria-label="Закрыть корзину"
          >
            ✕
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <div className="empty-icon">🛒</div>
            <p>Корзина пуста</p>
            <p className="empty-hint">Добавьте товары из каталога</p>
            <button 
              className="continue-shopping-btn"
              onClick={handleClose}
            >
              Продолжить покупки
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map(item => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
            
            <div className="cart-footer">
              <div className="cart-total">
                <span>Итого:</span>
                <span className="total-price">
                  {getTotalPrice().toLocaleString('ru-RU')} ₽
                </span>
              </div>
              
              <div className="cart-actions">
                <button 
                  className="clear-cart-btn" 
                  onClick={clearCart}
                >
                  Очистить
                </button>
                <button 
                  className="checkout-btn"
                  onClick={() => setShowCheckout(true)}
                >
                  Оформить заказ
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;