import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children, onProductsUpdate }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Загрузка товаров
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(data);
      return data;
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Ошибка загрузки товаров');
      // Fallback к локальным данным
      const { products: localProducts } = await import('../data/products');
      setProducts(localProducts);
      return localProducts;
    } finally {
      setLoading(false);
    }
  }, []);

  // Добавление товара
  const addProduct = useCallback(async (productData) => {
    setError(null);
    try {
      const newProduct = await createProduct(productData);
      setProducts(prev => [...prev, newProduct]);
      if (onProductsUpdate) {
        const updatedProducts = [...products, newProduct];
        onProductsUpdate(updatedProducts);
      }
      return newProduct;
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Ошибка добавления товара');
      throw error;
    }
  }, [products, onProductsUpdate]);

  // Обновление товара
  const editProduct = useCallback(async (id, productData) => {
    setError(null);
    try {
      const updatedProduct = await updateProduct(id, productData);
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      if (onProductsUpdate) {
        const updatedProducts = products.map(p => p.id === id ? updatedProduct : p);
        onProductsUpdate(updatedProducts);
      }
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Ошибка обновления товара');
      throw error;
    }
  }, [products, onProductsUpdate]);

  // Удаление товара
  const removeProduct = useCallback(async (id) => {
    setError(null);
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      if (onProductsUpdate) {
        const updatedProducts = products.filter(p => p.id !== id);
        onProductsUpdate(updatedProducts);
      }
    } catch (error) {
      console.error('Error removing product:', error);
      setError('Ошибка удаления товара');
      throw error;
    }
  }, [products, onProductsUpdate]);

  // Переключение активности товара
  const toggleProductActive = useCallback(async (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    try {
      await editProduct(id, { ...product, is_active: !product.is_active });
    } catch (error) {
      console.error('Error toggling product:', error);
      throw error;
    }
  }, [products, editProduct]);

  // Загрузка при монтировании
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const value = {
    products,
    loading,
    error,
    loadProducts,
    addProduct,
    editProduct,
    removeProduct,
    toggleProductActive,
    setError,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};