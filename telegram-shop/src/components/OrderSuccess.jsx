import React from 'react';

const OrderSuccess = ({ orderId }) => {
  return (
    <div className="cart-overlay">
      <div className="cart-panel success-panel">
        <div className="success-content">
          <div className="success-icon">✅</div>
          <h2>Заказ оформлен!</h2>
          {orderId && (
            <p className="order-number">
              Номер заказа: <strong>#{orderId}</strong>
            </p>
          )}
          <p>
            Спасибо за ваш заказ! Мы свяжемся с вами 
            в ближайшее время для подтверждения.
          </p>
          <button 
            className="continue-shopping-btn"
            onClick={() => window.location.reload()}
          >
            Вернуться в магазин
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;