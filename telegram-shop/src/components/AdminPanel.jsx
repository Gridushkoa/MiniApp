import React, { useState, useCallback } from 'react';
import { useAdmin } from '../context/AdminContext';
import ProductForm from './ProductForm';

const AdminPanel = () => {
  const { 
    products, 
    loading,  
    error: contextError,
    addProduct, 
    editProduct, 
    removeProduct,
    loadProducts,
    setError 
  } = useAdmin();

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const showMessage = useCallback((message, type = 'success') => {
    if (type === 'success') {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setLocalError(message);
      setTimeout(() => setLocalError(null), 3000);
    }
  }, []);

  const handleAddProduct = useCallback(() => {
    setEditingProduct(null);
    setShowForm(true);
    setLocalError(null);
  }, []);

  const handleEditProduct = useCallback((product) => {
    setEditingProduct(product);
    setShowForm(true);
    setLocalError(null);
  }, []);

  const handleDeleteProduct = useCallback(async (id, productName) => {
    if (!window.confirm(`Вы уверены, что хотите удалить товар "${productName}"?`)) {
      return;
    }

    try {
      await removeProduct(id);
      showMessage(`Товар "${productName}" успешно удален`);
      
      // Тактильная обратная связь
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (error) {
      showMessage('Ошибка при удалении товара', 'error');
      console.error('Delete error:', error);
    }
  }, [removeProduct, showMessage]);

  const handleFormSubmit = useCallback(async (productData) => {
    try {
      if (editingProduct) {
        await editProduct(editingProduct.id, productData);
        showMessage('Товар успешно обновлен');
      } else {
        await addProduct(productData);
        showMessage('Товар успешно добавлен');
      }
      
      setShowForm(false);
      setEditingProduct(null);
      
      // Тактильная обратная связь
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (error) {
      showMessage('Ошибка при сохранении товара', 'error');
      console.error('Save error:', error);
    }
  }, [editingProduct, addProduct, editProduct, showMessage]);

  const handleRefresh = useCallback(async () => {
    try {
      await loadProducts();
      showMessage('Список товаров обновлен');
    } catch (error) {
      showMessage('Ошибка при обновлении списка', 'error');
    }
  }, [loadProducts, showMessage]);

  if (loading && products.length === 0) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка товаров...</p>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      {(contextError || localError) && (
        <div className="admin-message error">
          <span>⚠️</span>
          <span>{contextError || localError}</span>
        </div>
      )}

      {successMessage && (
        <div className="admin-message success">
          <span>✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      <div className="admin-header">
        <h2>Управление товарами ({products.length})</h2>
        <div className="admin-controls">
          <button className="refresh-btn" onClick={handleRefresh}>
            🔄 Обновить
          </button>
          <button className="add-product-btn" onClick={handleAddProduct}>
            + Добавить товар
          </button>
        </div>
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      <div className="admin-products-list">
        {products.length === 0 ? (
          <div className="empty-products">
            <div className="empty-icon">📦</div>
            <h3>Нет товаров</h3>
            <p>Добавьте первый товар, нажав кнопку выше</p>
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} className="admin-product-item">
              <div className="admin-product-info">
                <img 
                  src={product.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMGYwZjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7QodC10YLRjDwvdGV4dD48L3N2Zz4='}
                  alt={product.name}
                  className="admin-product-image"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmMGYwZjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7QodC10YLRjDwvdGV4dD48L3N2Zz4=';
                  }}
                />
                <div className="admin-product-details">
                  <h3>{product.name}</h3>
                  <p className="admin-product-price">
                    {product.price.toLocaleString('ru-RU')} ₽
                  </p>
                  {product.category && (
                    <p className="admin-product-category">{product.category}</p>
                  )}
                </div>
              </div>
              
              <div className="admin-product-status">
                <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                  {product.is_active ? 'Активен' : 'Неактивен'}
                </span>
              </div>
              
              <div className="admin-product-actions">
                <button 
                  className="edit-btn"
                  onClick={() => handleEditProduct(product)}
                >
                  ✏️ Изменить
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteProduct(product.id, product.name)}
                >
                  🗑 Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPanel;