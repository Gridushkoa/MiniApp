import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart, isInCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart(product);
    setIsAdded(true);
    
    // Анимация добавления
    setTimeout(() => setIsAdded(false), 1500);
    
    // Тактильная обратная связь
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const placeholderImage = 'https://ralfvanveen.com/wp-content/uploads/2021/06/Placeholder-_-Begrippenlijst.webp' ;

  const inCart = isInCart(product.id);

  return (
    <div className="product-card">
      <img 
        src={imageError ? placeholderImage : product.image} 
        alt={product.name}
        className="product-image"
        loading="lazy"
        onError={handleImageError}
      />
      
      <div className="product-info">
        {product.category && (
          <span className="product-category">{product.category}</span>
        )}
        
        <h3 className="product-name">{product.name}</h3>
        
        <p className="product-description">{product.description}</p>
        
        <div className="product-bottom">
          <span className="product-price">
            {product.price.toLocaleString('ru-RU')} ₽
          </span>
          
          <button 
            className={`add-to-cart-btn ${isAdded ? 'added' : ''} ${inCart ? 'in-cart' : ''}`}
            onClick={handleAddToCart}
            disabled={isAdded}
          >
            {isAdded ? '✓ В корзине' : inCart ? 'Добавить еще' : 'В корзину'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;