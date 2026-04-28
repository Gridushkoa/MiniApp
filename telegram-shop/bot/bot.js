import pkg from 'grammy';
const { Bot, InlineKeyboard } = pkg;
import dotenv from 'dotenv';
import db from './database.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://your-app-url.com';

if (!TOKEN) {
  console.error('BOT_TOKEN is required in .env file');
  process.exit(1);
}

const bot = new Bot(TOKEN);

// Middleware для логирования
bot.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${new Date().toISOString()} ${ctx.from?.id} ${ctx.updateType} ${ms}ms`);
});

// Проверка прав администратора
function isAdmin(userId) {
  if (!userId) return false;
  const admin = db.prepare('SELECT * FROM admins WHERE user_id = ?').get(userId);
  return !!admin;
}

function isSuperAdmin(userId) {
  if (!userId) return false;
  const admin = db.prepare('SELECT * FROM admins WHERE user_id = ? AND role = ?').get(userId, 'superadmin');
  return !!admin;
}

// Главное меню админа
function getAdminKeyboard() {
  return new InlineKeyboard()
    .text('📦 Товары', 'admin_products')
    .text('📋 Заказы', 'admin_orders')
    .row()
    .text('➕ Добавить товар', 'admin_add_product')
    .text('📊 Статистика', 'admin_stats')
    .row()
    .url('🔗 Открыть магазин', WEBAPP_URL);
}

// Меню товаров
function getProductsKeyboard(page = 0) {
  const limit = 5;
  const offset = page * limit;
  const products = db.prepare('SELECT * FROM products ORDER BY id DESC LIMIT ? OFFSET ?').all(limit, offset);
  const total = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  
  const keyboard = new InlineKeyboard();
  
  products.forEach(product => {
    const status = product.is_active ? '✅' : '❌';
    keyboard.text(`${status} ${product.name} - ${product.price}₽`, `product_${product.id}`).row();
  });
  
  if (page > 0 || (page + 1) * limit < total) {
    if (page > 0) {
      keyboard.text('⬅️ Назад', `products_page_${page - 1}`);
    }
    if ((page + 1) * limit < total) {
      keyboard.text('Вперед ➡️', `products_page_${page + 1}`);
    }
    keyboard.row();
  }
  
  keyboard.text('🏠 Главное меню', 'admin_menu');
  
  return keyboard;
}

// Меню конкретного товара
function getProductKeyboard(productId) {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  
  if (!product) return null;
  
  const keyboard = new InlineKeyboard()
    .text('✏️ Изменить название', `edit_name_${productId}`).row()
    .text('📝 Изменить описание', `edit_desc_${productId}`).row()
    .text('💰 Изменить цену', `edit_price_${productId}`).row()
    .text('🖼 Изменить фото', `edit_image_${productId}`).row()
    .text('🏷 Изменить категорию', `edit_category_${productId}`).row()
    .text(
      product.is_active ? '🔴 Деактивировать' : '🟢 Активировать', 
      `toggle_product_${productId}`
    ).row()
    .text('🗑 Удалить товар', `delete_product_${productId}`).row()
    .text('📦 К списку товаров', 'admin_products').row()
    .text('🏠 Главное меню', 'admin_menu');
  
  return {
    text: `📦 *${product.name}*\n\n` +
          `📝 Описание: ${product.description || 'Нет описания'}\n` +
          `💰 Цена: ${product.price.toLocaleString()} ₽\n` +
          `🏷 Категория: ${product.category || 'Без категории'}\n` +
          `🖼 Фото: ${product.image ? 'Загружено ✅' : 'Отсутствует ❌'}\n` +
          `📅 Создан: ${new Date(product.created_at).toLocaleString('ru-RU')}\n` +
          `🔄 Обновлен: ${new Date(product.updated_at).toLocaleString('ru-RU')}\n` +
          `📊 Статус: ${product.is_active ? '✅ Активен' : '❌ Неактивен'}`,
    keyboard
  };
}

// Меню заказов
function getOrdersKeyboard(status = 'new') {
  const orders = db.prepare(
    'SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 5'
  ).all(status);
  
  const keyboard = new InlineKeyboard();
  
  orders.forEach(order => {
    keyboard.text(
      `📋 Заказ #${order.id.slice(0, 8)} - ${order.total.toLocaleString()}₽`, 
      `order_${order.id}`
    ).row();
  });
  
  keyboard
    .text('🆕 Новые', 'orders_new')
    .text('⚙️ В обработке', 'orders_processing')
    .text('✅ Выполненные', 'orders_completed')
    .row()
    .text('🏠 Главное меню', 'admin_menu');
  
  return keyboard;
}

// Команда /start
bot.command('start', async (ctx) => {
  const userId = ctx.from?.id;
  
  if (isAdmin(userId)) {
    await ctx.reply(
      '👋 Добро пожаловать в панель администратора магазина!\n\n' +
      'Здесь вы можете управлять товарами и заказами.',
      { reply_markup: getAdminKeyboard() }
    );
  } else {
    const keyboard = new InlineKeyboard()
      .url('🛍 Открыть магазин', WEBAPP_URL);
    
    await ctx.reply(
      '👋 Добро пожаловать в наш магазин!\n\n' +
      'Нажмите на кнопку ниже, чтобы открыть каталог товаров и сделать заказ.',
      { reply_markup: keyboard }
    );
  }
});

// Команда /admin
bot.command('admin', async (ctx) => {
  if (isAdmin(ctx.from?.id)) {
    await ctx.reply('🔐 Панель администратора', {
      reply_markup: getAdminKeyboard()
    });
  } else {
    await ctx.reply('⛔ У вас нет доступа к панели администратора.');
  }
});

// Команда /addadmin (только для суперадминов)
bot.command('addadmin', async (ctx) => {
  if (!isSuperAdmin(ctx.from?.id)) {
    return ctx.reply('⛔ Недостаточно прав');
  }
  
  const match = ctx.match;
  const newAdminId = parseInt(match);
  
  if (!newAdminId) {
    return ctx.reply('❌ Используйте: /addadmin ID_пользователя');
  }
  
  try {
    db.prepare('INSERT OR REPLACE INTO admins (user_id, role) VALUES (?, ?)')
      .run(newAdminId, 'admin');
    await ctx.reply(`✅ Пользователь ${newAdminId} добавлен как администратор`);
  } catch (error) {
    await ctx.reply('❌ Ошибка при добавлении администратора');
  }
});

// Обработка callback queries
bot.callbackQuery('admin_menu', async (ctx) => {
  await ctx.editMessageText('🔐 Панель администратора', {
    reply_markup: getAdminKeyboard()
  });
  await ctx.answerCallbackQuery();
});

bot.callbackQuery('admin_products', async (ctx) => {
  await ctx.editMessageText('📦 Управление товарами', {
    reply_markup: getProductsKeyboard()
  });
  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^products_page_(\d+)$/, async (ctx) => {
  const page = parseInt(ctx.match[1]);
  await ctx.editMessageText('📦 Управление товарами', {
    reply_markup: getProductsKeyboard(page)
  });
  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^product_(\d+)$/, async (ctx) => {
  const productId = ctx.match[1];
  const productData = getProductKeyboard(productId);
  if (productData) {
    await ctx.editMessageText(productData.text, {
      parse_mode: 'Markdown',
      reply_markup: productData.keyboard
    });
  }
  await ctx.answerCallbackQuery();
});

bot.callbackQuery('admin_add_product', async (ctx) => {
  const result = db.prepare('INSERT INTO products (name, price) VALUES (?, ?)').run('Новый товар', 0);
  const newProductId = result.lastInsertRowid;
  
  const productData = getProductKeyboard(newProductId);
  if (productData) {
    await ctx.editMessageText(`✅ Товар создан!\n\n${productData.text}`, {
      parse_mode: 'Markdown',
      reply_markup: productData.keyboard
    });
  }
  await ctx.answerCallbackQuery();
});

// Редактирование полей
bot.callbackQuery(/^edit_(name|desc|price|image|category)_(\d+)$/, async (ctx) => {
  const [, field, productId] = ctx.match;
  
  const fieldNames = {
    name: 'название',
    desc: 'описание',
    price: 'цену',
    image: 'ссылку на изображение',
    category: 'категорию'
  };
  
  await ctx.editMessageText(`✏️ Введите новое ${fieldNames[field]} для товара:`, {
    reply_markup: new InlineKeyboard()
      .text('❌ Отмена', `product_${productId}`)
  });
  
  db.prepare('INSERT OR REPLACE INTO edit_context (user_id, product_id, field) VALUES (?, ?, ?)')
    .run(ctx.from.id, productId, field);
  
  await ctx.answerCallbackQuery();
});

// Активация/деактивация
bot.callbackQuery(/^toggle_product_(\d+)$/, async (ctx) => {
  const productId = ctx.match[1];
  const product = db.prepare('SELECT is_active FROM products WHERE id = ?').get(productId);
  
  db.prepare('UPDATE products SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(product.is_active ? 0 : 1, productId);
  
  const productData = getProductKeyboard(productId);
  if (productData) {
    await ctx.editMessageText(productData.text, {
      parse_mode: 'Markdown',
      reply_markup: productData.keyboard
    });
  }
  await ctx.answerCallbackQuery();
});

// Удаление товара
bot.callbackQuery(/^delete_product_(\d+)$/, async (ctx) => {
  const productId = ctx.match[1];
  await ctx.editMessageText('⚠️ Вы уверены, что хотите удалить этот товар?', {
    reply_markup: new InlineKeyboard()
      .text('✅ Да, удалить', `confirm_delete_${productId}`)
      .text('❌ Отмена', `product_${productId}`)
  });
  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^confirm_delete_(\d+)$/, async (ctx) => {
  const productId = ctx.match[1];
  db.prepare('DELETE FROM products WHERE id = ?').run(productId);
  
  await ctx.editMessageText('✅ Товар успешно удален!', {
    reply_markup: getProductsKeyboard()
  });
  await ctx.answerCallbackQuery();
});

// Заказы
bot.callbackQuery('admin_orders', async (ctx) => {
  const orders = db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 5').all('new');
  
  let text = '📋 *Заказы*\n\n';
  if (orders.length === 0) {
    text += 'Нет новых заказов';
  } else {
    orders.forEach(order => {
      const items = JSON.parse(order.items);
      text += `🔖 Заказ #${order.id.slice(0, 8)}\n` +
              `👤 ${order.customer_name}\n` +
              `📞 ${order.customer_phone}\n` +
              `💰 ${order.total.toLocaleString()}₽\n` +
              `📦 ${items.length} товаров\n\n`;
    });
  }
  
  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: getOrdersKeyboard()
  });
  await ctx.answerCallbackQuery();
});

// Фильтр заказов по статусу
bot.callbackQuery(/^orders_(new|processing|completed)$/, async (ctx) => {
  const status = ctx.match[1];
  const orders = db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status);
  
  const statusNames = {
    new: 'Новые',
    processing: 'В обработке',
    completed: 'Выполненные'
  };
  
  let text = `📋 Заказы (${statusNames[status]})\n\n`;
  if (orders.length === 0) {
    text += 'Нет заказов с этим статусом';
  } else {
    orders.forEach(order => {
      text += `🔖 Заказ #${order.id.slice(0, 8)}\n` +
              `👤 ${order.customer_name}\n` +
              `💰 ${order.total.toLocaleString()}₽\n\n`;
    });
  }
  
  await ctx.editMessageText(text, {
    reply_markup: getOrdersKeyboard(status)
  });
  await ctx.answerCallbackQuery();
});

// Конкретный заказ
bot.callbackQuery(/^order_(.+)$/, async (ctx) => {
  const orderId = ctx.match[1];
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    await ctx.editMessageText('Заказ не найден', {
      reply_markup: getAdminKeyboard()
    });
    await ctx.answerCallbackQuery();
    return;
  }
  
  const items = JSON.parse(order.items);
  const itemsText = items.map(item => 
    `- ${item.name} x${item.quantity} = ${(item.price * item.quantity).toLocaleString()}₽`
  ).join('\n');
  
  const statusNames = {
    new: '🆕 Новый',
    processing: '⚙️ В обработке',
    completed: '✅ Выполнен',
    cancelled: '❌ Отменен'
  };
  
  const text = `📋 *Заказ #${order.id.slice(0, 8)}*\n\n` +
               `👤 Клиент: ${order.customer_name}\n` +
               `📞 Телефон: ${order.customer_phone}\n` +
               `📍 Адрес: ${order.customer_address}\n` +
               `💬 Комментарий: ${order.comment || 'Нет'}\n\n` +
               `📦 Товары:\n${itemsText}\n\n` +
               `💰 Итого: ${order.total.toLocaleString()} ₽\n` +
               `📊 Статус: ${statusNames[order.status]}\n` +
               `📅 Дата: ${new Date(order.created_at).toLocaleString('ru-RU')}`;
  
  const keyboard = new InlineKeyboard();
  
  if (order.status === 'new') {
    keyboard.text('✅ Принять в обработку', `process_${orderId}`).row();
  }
  if (order.status === 'processing') {
    keyboard.text('✔️ Завершить заказ', `complete_${orderId}`).row();
  }
  if (order.status !== 'cancelled' && order.status !== 'completed') {
    keyboard.text('❌ Отменить заказ', `cancel_${orderId}`).row();
  }
  
  keyboard
    .text('📋 К списку заказов', 'admin_orders').row()
    .text('🏠 Главное меню', 'admin_menu');
  
  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
  await ctx.answerCallbackQuery();
});

// Изменение статуса заказа
bot.callbackQuery(/^(process|complete|cancel)_(.+)$/, async (ctx) => {
  const [, action, orderId] = ctx.match;
  
  const statusMap = {
    process: 'processing',
    complete: 'completed',
    cancel: 'cancelled'
  };
  
  const newStatus = statusMap[action];
  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newStatus, orderId);
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  // Уведомление клиенту
  const statusMessages = {
    processing: `✅ Ваш заказ #${order.id.slice(0, 8)} принят в обработку!\nМы свяжемся с вами в ближайшее время.`,
    completed: `🎉 Ваш заказ #${order.id.slice(0, 8)} выполнен!\nСпасибо за покупку!`,
    cancelled: `❌ Ваш заказ #${order.id.slice(0, 8)} отменен.\nПо вопросам обращайтесь к администратору.`
  };
  
  if (order.user_id) {
    await ctx.api.sendMessage(order.user_id, statusMessages[newStatus])
      .catch(err => console.log(`Failed to notify user ${order.user_id}:`, err.message));
  }
  
  const actionNames = {
    process: 'принят в обработку',
    complete: 'завершен',
    cancel: 'отменен'
  };
  
  const resultKeyboard = new InlineKeyboard()
    .text('📋 К заказам', 'admin_orders').row()
    .text('🏠 Главное меню', 'admin_menu');
  
  await ctx.editMessageText(`✅ Заказ #${orderId.slice(0, 8)} ${actionNames[action]}`, {
    reply_markup: resultKeyboard
  });
  await ctx.answerCallbackQuery();
});

// Статистика
bot.callbackQuery('admin_stats', async (ctx) => {
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get().count;
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const totalRevenue = db.prepare('SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status = ?').get('completed').total;
  const newOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('new').count;
  
  const text = `📊 *Статистика магазина*\n\n` +
               `📦 Активных товаров: ${totalProducts}\n` +
               `📋 Всего заказов: ${totalOrders}\n` +
               `🆕 Новых заказов: ${newOrders}\n` +
               `💰 Общая выручка: ${totalRevenue.toLocaleString()} ₽`;
  
  const statsKeyboard = new InlineKeyboard()
    .text('🔄 Обновить', 'admin_stats')
    .text('🏠 Главное меню', 'admin_menu');
  
  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: statsKeyboard
  });
  await ctx.answerCallbackQuery();
});

// Обработка текстовых сообщений для редактирования
bot.on('message:text', async (ctx) => {
  const userId = ctx.from?.id;
  const text = ctx.message.text;
  
  // Пропускаем команды
  if (text.startsWith('/')) return;
  
  // Для обычных пользователей - показываем кнопку открытия магазина
  if (!isAdmin(userId)) {
    const keyboard = new InlineKeyboard()
      .url('🛍 Открыть магазин', WEBAPP_URL);
    
    return ctx.reply('Для просмотра каталога используйте кнопку ниже:', {
      reply_markup: keyboard
    });
  }
  
  // Проверяем контекст редактирования
  const editContext = db.prepare('SELECT * FROM edit_context WHERE user_id = ?').get(userId);
  
  if (editContext) {
    const { product_id, field } = editContext;
    
    switch (field) {
      case 'name':
        db.prepare('UPDATE products SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(text, product_id);
        break;
      case 'desc':
        db.prepare('UPDATE products SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(text, product_id);
        break;
      case 'price':
        const price = parseInt(text.replace(/[^0-9]/g, ''));
        if (isNaN(price) || price < 0) {
          return ctx.reply('❌ Пожалуйста, введите корректную цену (только число)');
        }
        db.prepare('UPDATE products SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(price, product_id);
        break;
      case 'image':
        db.prepare('UPDATE products SET image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(text, product_id);
        break;
      case 'category':
        db.prepare('UPDATE products SET category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(text, product_id);
        break;
    }
    
    db.prepare('DELETE FROM edit_context WHERE user_id = ?').run(userId);
    
    await ctx.reply('✅ Изменения сохранены!');
    
    const productData = getProductKeyboard(product_id);
    if (productData) {
      await ctx.reply(productData.text, {
        parse_mode: 'Markdown',
        reply_markup: productData.keyboard
      });
    }
  } else {
    await ctx.reply('Используйте меню для управления магазином:', {
      reply_markup: getAdminKeyboard()
    });
  }
});

// Обработка данных из WebApp
bot.on('message:web_app_data', async (ctx) => {
  try {
    const data = JSON.parse(ctx.message.web_app_data.data);
    
    const orderId = uuidv4();
    db.prepare(`
      INSERT INTO orders (id, user_id, username, items, total, customer_name, customer_phone, customer_address, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      ctx.from?.id,
      ctx.from?.username || '',
      JSON.stringify(data.items),
      data.total,
      data.customer.name,
      data.customer.phone,
      data.customer.address,
      data.customer.comment || ''
    );
    
    const itemsList = data.items.map(item => 
      `• ${item.name} x${item.quantity} - ${(item.price * item.quantity).toLocaleString()}₽`
    ).join('\n');
    
    await ctx.reply(
      `✅ *Заказ успешно оформлен!*\n\n` +
      `📋 Номер заказа: #${orderId.slice(0, 8)}\n\n` +
      `📦 *Товары:*\n${itemsList}\n\n` +
      `💰 *Итого: ${data.total.toLocaleString()} ₽*\n\n` +
      `👤 Имя: ${data.customer.name}\n` +
      `📞 Телефон: ${data.customer.phone}\n` +
      `📍 Адрес: ${data.customer.address}\n\n` +
      `Мы свяжемся с вами для подтверждения заказа.`,
      { parse_mode: 'Markdown' }
    );
    
    // Уведомляем администраторов
    const admins = db.prepare('SELECT user_id FROM admins').all();
    for (const admin of admins) {
      await ctx.api.sendMessage(admin.user_id,
        `🆕 *Новый заказ!*\n\n` +
        `📋 Номер: #${orderId.slice(0, 8)}\n` +
        `👤 Клиент: ${data.customer.name}\n` +
        `📞 Телефон: ${data.customer.phone}\n` +
        `💰 Сумма: ${data.total.toLocaleString()} ₽\n` +
        `📦 Товаров: ${data.items.length}\n\n` +
        `Используйте /admin для управления заказами.`,
        { parse_mode: 'Markdown' }
      ).catch(err => console.log(`Failed to notify admin ${admin.user_id}:`, err.message));
    }
    
  } catch (error) {
    console.error('WebApp data error:', error);
    await ctx.reply('❌ Произошла ошибка при оформлении заказа. Попробуйте еще раз.');
  }
});

// Запуск бота
bot.start({
  onStart: (botInfo) => {
    console.log(`🤖 Бот @${botInfo.username} запущен и готов к работе!`);
  }
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;