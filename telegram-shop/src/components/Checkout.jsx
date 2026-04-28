import React, { useState, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/api';
import OrderSuccess from './OrderSuccess';

const Checkout = ({ onBack }) => {
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    comment: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Введите имя';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Введите телефон';
    } else if (!/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(formData.phone)) {
      newErrors.phone = 'Неверный формат телефона';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Введите адрес доставки';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Отправка заказа на сервер
      const orderData = {
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: getTotalPrice(),
        customer: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          comment: formData.comment
        }
      };

      const result = await createOrder(orderData);
      setOrderId(result.id);

      // Отправка данных через Telegram WebApp если доступно
      const telegram = window.Telegram?.WebApp;
      if (telegram?.sendData) {
        try {
          telegram.sendData(JSON.stringify(orderData));
        } catch (telegramError) {
          console.warn('Telegram sendData failed:', telegramError);
        }
      }

      // Тактильная обратная связь
      if (telegram?.HapticFeedback) {
        telegram.HapticFeedback.notificationOccurred('success');
      }

      setOrderPlaced(true);
      clearCart();
      
    } catch (error) {
      console.error('Order submission error:', error);
      setError('Ошибка при оформлении заказа. Попробуйте еще раз.');
      
      // Тактильная обратная связь об ошибке
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Очистка ошибки поля при изменении
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  }, [errors]);

  if (orderPlaced) {
    return <OrderSuccess orderId={orderId} />;
  }

  return (
    <div className="cart-overlay">
      <div className="cart-panel checkout-panel">
        <div className="cart-header">
          <h2>Оформление заказа</h2>
          <button className="close-btn" onClick={onBack} aria-label="Назад">
            ←
          </button>
        </div>

        <div className="order-summary">
          <h3>Ваш заказ:</h3>
          {cartItems.map(item => (
            <div key={item.id} className="order-item">
              <span>{item.name} × {item.quantity}</span>
              <span>{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
            </div>
          ))}
          <div className="order-total">
            <strong>Итого к оплате:</strong>
            <strong>{getTotalPrice().toLocaleString('ru-RU')} ₽</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Имя *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ваше имя"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Телефон *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+7 (999) 999-99-99"
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="address">Адрес доставки *</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="Город, улица, дом, квартира"
              rows="2"
              className={errors.address ? 'error' : ''}
            />
            {errors.address && <span className="error-message">{errors.address}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="comment">Комментарий к заказу</label>
            <textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              placeholder="Дополнительная информация (необязательно)"
              rows="2"
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-order-btn"
            disabled={loading}
          >
            {loading ? 'Оформление...' : 'Подтвердить заказ'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;