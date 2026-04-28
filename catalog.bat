@echo off
chcp 65001 >nul
echo Creating telegram-shop project structure...

REM Create main directories
mkdir telegram-shop 2>nul
mkdir telegram-shop\bot 2>nul
mkdir telegram-shop\server 2>nul
mkdir telegram-shop\server\routes 2>nul
mkdir telegram-shop\src 2>nul
mkdir telegram-shop\src\components 2>nul
mkdir telegram-shop\src\context 2>nul
mkdir telegram-shop\src\services 2>nul
mkdir telegram-shop\src\data 2>nul

REM Create bot files
type nul > telegram-shop\bot\bot.js 2>nul
type nul > telegram-shop\bot\database.js 2>nul

REM Create server files
type nul > telegram-shop\server\index.js 2>nul
type nul > telegram-shop\server\routes\products.js 2>nul
type nul > telegram-shop\server\routes\orders.js 2>nul

REM Create component files
type nul > telegram-shop\src\components\Header.jsx 2>nul
type nul > telegram-shop\src\components\ProductCard.jsx 2>nul
type nul > telegram-shop\src\components\Cart.jsx 2>nul
type nul > telegram-shop\src\components\CartItem.jsx 2>nul
type nul > telegram-shop\src\components\Checkout.jsx 2>nul
type nul > telegram-shop\src\components\OrderSuccess.jsx 2>nul
type nul > telegram-shop\src\components\AdminPanel.jsx 2>nul
type nul > telegram-shop\src\components\ProductForm.jsx 2>nul
type nul > telegram-shop\src\components\AdminLogin.jsx 2>nul

REM Create context files
type nul > telegram-shop\src\context\CartContext.jsx 2>nul
type nul > telegram-shop\src\context\AdminContext.jsx 2>nul

REM Create services and data files
type nul > telegram-shop\src\services\api.js 2>nul
type nul > telegram-shop\src\data\products.js 2>nul

REM Create root files
type nul > telegram-shop\src\App.jsx 2>nul
type nul > telegram-shop\src\App.css 2>nul
type nul > telegram-shop\src\main.jsx 2>nul
type nul > telegram-shop\index.html 2>nul
type nul > telegram-shop\package.json 2>nul
type nul > telegram-shop\vite.config.js 2>nul
type nul > telegram-shop\.env 2>nul

echo.
echo ✅ Project structure created successfully!
echo.
echo telegram-shop/
echo ├── bot/
echo │   ├── bot.js
echo │   └── database.js
echo ├── server/
echo │   ├── index.js
echo │   └── routes/
echo │       ├── products.js
echo │       └── orders.js
echo ├── src/
echo │   ├── components/
echo │   │   ├── Header.jsx
echo │   │   ├── ProductCard.jsx
echo │   │   ├── Cart.jsx
echo │   │   ├── CartItem.jsx
echo │   │   ├── Checkout.jsx
echo │   │   ├── OrderSuccess.jsx
echo │   │   ├── AdminPanel.jsx
echo │   │   ├── ProductForm.jsx
echo │   │   └── AdminLogin.jsx
echo │   ├── context/
echo │   │   ├── CartContext.jsx
echo │   │   └── AdminContext.jsx
echo │   ├── services/
echo │   │   └── api.js
echo │   ├── data/
echo │   │   └── products.js
echo │   ├── App.jsx
echo │   ├── App.css
echo │   └── main.jsx
echo ├── index.html
echo ├── package.json
echo ├── vite.config.js
echo └── .env
echo.
echo 📁 Total folders created: 9
echo 📄 Total files created: 24
echo.
pause