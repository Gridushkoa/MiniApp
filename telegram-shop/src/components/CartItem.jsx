import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const [imageError, setImageError] = useState(false);

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 0 && newQuantity <= 99) {
      updateQuantity(item.id, newQuantity);
      
      // Тактильная обратная связь
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    }
  };

  const handleRemove = () => {
    if (window.confirm('Удалить товар из корзины?')) {
      removeFromCart(item.id);
      
      // Тактильная обратная связь
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
      }
    }
  };

  const placeholderImage = 'https://ralfvanveen.com/wp-content/uploads/2021/06/Placeholder-_-Begrippenlijst.webp' ;

  return (
    <div className="cart-item">
      <img 
        src={imageError ? placeholderImage : item.image} 
        alt={item.name}
        className="cart-item-image"
        onError={() => setImageError(true)}
      />
      
      <div className="cart-item-info">
        <h4 className="cart-item-name">{item.name}</h4>
        <p className="cart-item-price">
          {item.price.toLocaleString('ru-RU')} ₽ / шт
        </p>
        
        <div className="cart-item-controls">
          <button 
            className="quantity-btn"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
            aria-label="Уменьшить количество"
          >
            −
          </button>
          <span className="quantity">{item.quantity}</span>
          <button 
            className="quantity-btn"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={item.quantity >= 99}
            aria-label="Увеличить количество"
          >
            +
          </button>
        </div>
      </div>
      
      <button 
        className="remove-btn"
        onClick={handleRemove}
        aria-label="Удалить товар"
      >
        ✕
      </button>
      
      <div className="cart-item-total">
        {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
      </div>
    </div>
  );
};

export default CartItem;