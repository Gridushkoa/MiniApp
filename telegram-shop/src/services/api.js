import axios from 'axios';

// Для Vercel используем прямые данные или мок-API
const API_URL = import.meta.env.VITE_API_URL || 'https://your-backend-url.com/api';

// Временное хранилище для тестирования
let localProducts = [
  {
    id: 1,
    name: "Беспроводные наушники",
    description: "Bluetooth 5.0, активное шумоподавление, 30 часов работы",
    price: 4990,
    image: "https://picsum.photos/seed/headphones/400/400",
    category: "Электроника",
    is_active: true
  },
  {
    id: 2,
    name: "Умные часы",
    description: "Фитнес-трекер с пульсометром, GPS, водонепроницаемые",
    price: 8990,
    image: "https://picsum.photos/seed/smartwatch/400/400",
    category: "Электроника",
    is_active: true
  },
  {
    id: 3,
    name: "Портативная колонка",
    description: "Мощность 20W, защита IPX7, Bluetooth 5.2",
    price: 3490,
    image: "https://picsum.photos/seed/speaker/400/400",
    category: "Аудио",
    is_active: true
  },
  {
    id: 4,
    name: "Рюкзак городской",
    description: "Водоотталкивающий материал, отделение для ноутбука 15.6\"",
    price: 4290,
    image: "https://picsum.photos/seed/backpack/400/400",
    category: "Аксессуары",
    is_active: true
  },
  {
    id: 5,
    name: "Power Bank 20000mAh",
    description: "Быстрая зарядка 65W, USB-C и USB-A",
    price: 2790,
    image: "https://picsum.photos/seed/powerbank/400/400",
    category: "Электроника",
    is_active: true
  },
  {
    id: 6,
    name: "Кофе-машина автоматическая",
    description: "15 бар давления, встроенный капучинатор",
    price: 15990,
    image: "https://picsum.photos/seed/coffee/400/400",
    category: "Бытовая техника",
    is_active: true
  }
];

let nextId = 7;

// Проверяем, доступен ли реальный API
const isApiAvailable = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`, { timeout: 2000 });
    return response.data.status === 'ok';
  } catch {
    return false;
  }
};

// Экспортируемые функции API
export const getProducts = async () => {
  try {
    const apiAvailable = await isApiAvailable();
    if (apiAvailable) {
      const response = await axios.get(`${API_URL}/products`);
      return response.data;
    }
  } catch (error) {
    console.warn('API not available, using local data');
  }
  return localProducts.filter(p => p.is_active);
};

export const getProduct = async (id) => {
  try {
    const apiAvailable = await isApiAvailable();
    if (apiAvailable) {
      const response = await axios.get(`${API_URL}/products/${id}`);
      return response.data;
    }
  } catch (error) {
    console.warn('API not available, using local data');
  }
  return localProducts.find(p => p.id === parseInt(id));
};

export const createProduct = async (productData) => {
  try {
    const apiAvailable = await isApiAvailable();
    if (apiAvailable) {
      const response = await axios.post(`${API_URL}/products`, productData);
      return response.data;
    }
  } catch (error) {
    console.warn('API not available, saving locally');
  }
  
  const newProduct = {
    id: nextId++,
    ...productData,
    is_active: true,
    created_at: new Date().toISOString()
  };
  localProducts.push(newProduct);
  return newProduct;
};

export const updateProduct = async (id, productData) => {
  try {
    const apiAvailable = await isApiAvailable();
    if (apiAvailable) {
      const response = await axios.put(`${API_URL}/products/${id}`, productData);
      return response.data;
    }
  } catch (error) {
    console.warn('API not available, updating locally');
  }
  
  const index = localProducts.findIndex(p => p.id === parseInt(id));
  if (index !== -1) {
    localProducts[index] = { ...localProducts[index], ...productData };
    return localProducts[index];
  }
  throw new Error('Product not found');
};

export const deleteProduct = async (id) => {
  try {
    const apiAvailable = await isApiAvailable();
    if (apiAvailable) {
      const response = await axios.delete(`${API_URL}/products/${id}`);
      return response.data;
    }
  } catch (error) {
    console.warn('API not available, deleting locally');
  }
  
  localProducts = localProducts.filter(p => p.id !== parseInt(id));
  return { success: true };
};

export const createOrder = async (orderData) => {
  // Отправка данных через Telegram WebApp
  const telegram = window.Telegram?.WebApp;
  if (telegram?.sendData) {
    telegram.sendData(JSON.stringify(orderData));
    return { success: true, message: 'Order sent to bot' };
  }
  
  // Fallback: пробуем отправить на API
  try {
    const apiAvailable = await isApiAvailable();
    if (apiAvailable) {
      const response = await axios.post(`${API_URL}/orders`, orderData);
      return response.data;
    }
  } catch (error) {
    console.warn('Could not send order to API');
  }
  
  return { success: false, message: 'Order service unavailable' };
};

export default {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createOrder
};