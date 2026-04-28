import React, { useState } from 'react';

const AdminLogin = ({ onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Проверка через Telegram WebApp
      const telegram = window.Telegram?.WebApp;
      if (telegram) {
        const userId = telegram.initDataUnsafe?.user?.id;
        if (userId) {
          // Отправка на сервер для проверки
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId, 
              password,
              initData: telegram.initData 
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.isAdmin) {
              // Сохраняем ID админа в localStorage
              const adminIds = JSON.parse(localStorage.getItem('adminIds') || '[]');
              if (!adminIds.includes(userId)) {
                adminIds.push(userId);
                localStorage.setItem('adminIds', JSON.stringify(adminIds));
              }
              onSuccess();
              return;
            }
          }
        }
      }

      // Для тестирования в браузере - простой пароль
      if (password === 'admin123') {
        localStorage.setItem('isAdminMode', 'true');
        onSuccess();
      } else {
        setError('Неверный пароль или недостаточно прав');
        // Тактильная обратная связь
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
      }
    } catch (err) {
      setError('Ошибка при проверке прав доступа');
      console.error('Admin login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="admin-login">
        <h3>🔐 Вход для администратора</h3>
        <p>Введите пароль для доступа к панели управления</p>

        {error && (
          <div className="admin-login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
              autoFocus
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="save-btn"
              disabled={loading}
            >
              {loading ? 'Проверка...' : 'Войти'}
            </button>
            <button 
              type="button" 
              className="cancel-btn"
              onClick={onCancel}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;