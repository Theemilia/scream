// auth.js - основной файл для работы с аутентификацией и корзиной

// Константы для ключей localStorage
const STORAGE_KEYS = {
  USERS: 'users',
  AUTH: 'isAuthenticated',
  CURRENT_USER: 'currentUser',
  CART: 'cart',
  ORDERS: 'orders',
  RETURN_URL: 'returnUrl'
};

// Функция для инициализации хранилища
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CART)) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
  }
}

// Функция для проверки авторизации пользователя
function checkAuth() {
  return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
}

// Функция для получения текущего пользователя
function getCurrentUser() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
}

// Функция для перенаправления на страницу авторизации
function redirectToAuthPage() {
  const currentUrl = window.location.href;
  localStorage.setItem(STORAGE_KEYS.RETURN_URL, currentUrl);
  window.location.href = 'authorization.html';
}

// Функция для регистрации нового пользователя
function registerUser(userData) {
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
  
  // Проверка на существующего пользователя
  const userExists = users.some(user => 
    user.login === userData.login || user.email === userData.email
  );
  
  if (userExists) {
    return { success: false, message: 'Пользователь с таким логином или email уже существует' };
  }
  
  // Добавляем нового пользователя
  users.push(userData);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  
  return { success: true, message: 'Регистрация прошла успешно!' };
}

// Функция для авторизации пользователя
function loginUser(login, password) {
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
  const user = users.find(u => 
    (u.login === login || u.email === login) && u.password === password
  );
  
  if (!user) {
    return { success: false, message: 'Неверный логин или пароль' };
  }
  
  // Сохраняем данные авторизации
  localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  
  return { success: true, message: 'Авторизация успешна!', user };
}

// Функция для выхода пользователя
function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.AUTH);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// Функция для добавления услуги в корзину
function addToCart(serviceId, stylistId, price, serviceName, stylistName, serviceImage) {
  if (!checkAuth()) {
    redirectToAuthPage();
    return { success: false, message: 'Требуется авторизация' };
  }
  
  let cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [];
  const existingItemIndex = cart.findIndex(item => 
    item.serviceId === serviceId && item.stylistId === stylistId
  );
  
  if (existingItemIndex !== -1) {
    cart[existingItemIndex].quantity += 1;
  } else {
    cart.push({
      serviceId,
      stylistId,
      price,
      serviceName,
      stylistName,
      serviceImage,
      quantity: 1
    });
  }
  
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  updateCartCounter();
  
  return { 
    success: true, 
    message: `Услуга "${serviceName}" добавлена в корзину`,
    cart 
  };
}

// Функция для обновления счетчика корзины
function updateCartCounter() {
  const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [];
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Удаляем старый счетчик, если есть
  const oldCounter = document.querySelector('.cart-counter');
  if (oldCounter) oldCounter.remove();
  
  // Создаем новый счетчик
  const cartIcon = document.querySelector('.fa-shopping-cart')?.parentNode;
  if (cartIcon && totalItems > 0) {
    const counter = document.createElement('span');
    counter.className = 'cart-counter';
    counter.textContent = totalItems;
    cartIcon.appendChild(counter);
  }
}

// Функция для показа уведомления с анимацией всплытия сверху
function showNotification(message, type = 'success') {
  // Определяем иконку в зависимости от типа
  let icon;
  switch(type) {
    case 'success':
      icon = 'ri-checkbox-circle-fill';
      break;
    case 'error':
      icon = 'ri-close-circle-fill';
      break;
    case 'info':
      icon = 'ri-information-fill';
      break;
    default:
      icon = 'ri-notification-fill';
  }

  // Создаем уведомление
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="${icon}"></i>
    <p>${message}</p>
  `;
  
  // Добавляем на страницу
  document.body.appendChild(notification);
  
  // Показываем с анимацией
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Убираем через 3.5 секунды
  setTimeout(() => {
    notification.classList.remove('show');
    // Удаляем после завершения анимации
    setTimeout(() => {
      notification.remove();
    }, 400);
  }, 3500);
}

// Функция для показа модального окна с контактными данными
function showContactInfoModal(user, callback) {
  const modal = document.createElement('div');
  modal.className = 'contact-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Пожалуйста, укажите контактные данные</h3>
      <p>Нам нужны эти данные для связи с вами по поводу заказа</p>
      <form id="contact-form">
        <div class="form-group">
          <label for="checkout-email">Email *</label>
          <input type="email" id="checkout-email" value="${user.email || ''}" required placeholder="Ваш email">
        </div>
        <div class="form-group">
          <label for="checkout-phone">Телефон *</label>
          <input type="tel" id="checkout-phone" value="${user.phone || ''}" required placeholder="Ваш телефон">
        </div>
        <div class="modal-buttons">
          <button type="button" class="button secondary modal-close">Отмена</button>
          <button type="submit" class="button primary">Продолжить оформление</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Обработчик закрытия модального окна
  modal.querySelector('.modal-close').addEventListener('click', () => {
    document.body.removeChild(modal);
    document.body.style.overflow = '';
  });
  
  // Обработчик отправки формы
  modal.querySelector('#contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('checkout-email').value;
    const phone = document.getElementById('checkout-phone').value;
    
    if (!email || !phone) {
      showNotification('Пожалуйста, заполните все обязательные поля', 'error');
      return;
    }
    
    // Обновляем данные пользователя
    const updatedUser = {
      ...user,
      email,
      phone
    };
    
    // Сохраняем обновленные данные
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    const userIndex = users.findIndex(u => u.login === user.login);
    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
    }
    
    // Закрываем модальное окно
    document.body.removeChild(modal);
    document.body.style.overflow = '';
    
    // Вызываем callback с обновленными данными
    callback(updatedUser);
  });
}

// Функция для оформления заказа
function checkout() {
  if (!checkAuth()) {
    redirectToAuthPage();
    return;
  }
  
  const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [];
  if (cart.length === 0) {
    showNotification('Ваша корзина пуста!', 'error');
    return;
  }
  
  const user = getCurrentUser();
  
  // Проверяем наличие email и телефона
  if (!user.email || !user.phone) {
    // Показываем модальное окно для ввода контактных данных
    showContactInfoModal(user, (updatedUser) => {
      // После ввода данных продолжаем оформление заказа
      proceedWithCheckout(updatedUser, cart);
    });
    return;
  }
  
  // Если данные есть, продолжаем оформление
  proceedWithCheckout(user, cart);
}

// Функция для завершения оформления заказа
function proceedWithCheckout(user, cart) {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const order = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    status: 'В обработке',
    items: [...cart],
    total: total,
    userId: user.login,
    userEmail: user.email,
    userPhone: user.phone
  };
  
  // Сохраняем заказ
  const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
  orders.push(order);
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  
  // Очищаем корзину
  localStorage.removeItem(STORAGE_KEYS.CART);
  updateCartCounter();
  
  showNotification('Заказ успешно оформлен!', 'success');
  setTimeout(() => {
    window.location.href = 'profil.html';
  }, 2000);
}

// Функция для инициализации страницы корзины
function initCartPage() {
  const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [];
  const cartContainer = document.querySelector('.cart-container');
  const totalContainer = document.querySelector('.cart-total');
  
  if (cart.length === 0) {
    cartContainer.innerHTML = `
      <div class="empty-cart">
        <i class="ri-shopping-cart-line"></i>
        <h3>Ваша корзина пуста</h3>
        <a href="yslygi.html" class="button">Перейти к услугам</a>
      </div>
    `;
    return;
  }
  
  let total = 0;
  let itemsHTML = '';
  
  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    itemsHTML += `
      <div class="cart-item">
        <div class="cart-item-image">
          <img src="${item.serviceImage}" alt="${item.serviceName}">
        </div>
        <div class="cart-item-details">
          <h3>${item.serviceName}</h3>
          <p>Стилист: ${item.stylistName}</p>
          <div class="cart-item-price">${item.price} ₽ × ${item.quantity} = ${itemTotal} ₽</div>
        </div>
        <div class="cart-item-actions">
          <button class="quantity-btn minus" data-index="${index}">−</button>
          <span class="quantity">${item.quantity}</span>
          <button class="quantity-btn plus" data-index="${index}">+</button>
          <button class="remove-btn" data-index="${index}"><i class="ri-delete-bin-line"></i></button>
        </div>
      </div>
    `;
  });
  
  cartContainer.innerHTML = itemsHTML;
  totalContainer.innerHTML = `
    <div class="total-sum">Итого: ${total} ₽</div>
    <button class="checkout-btn">Оформить заказ</button>
  `;
  
  // Обработчики для кнопок
  document.querySelectorAll('.quantity-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      updateCartItem(index, this.classList.contains('plus') ? 1 : -1);
    });
  });
  
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      removeCartItem(index);
    });
  });
  
  document.querySelector('.checkout-btn')?.addEventListener('click', checkout);
}

// Функция для обновления элемента корзины
function updateCartItem(index, change) {
  let cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART));
  cart[index].quantity += change;
  
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  initCartPage();
  updateCartCounter();
}

// Функция для удаления элемента корзины
function removeCartItem(index) {
  let cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART));
  cart.splice(index, 1);
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  initCartPage();
  updateCartCounter();
}

// Инициализация обработчиков событий
function initEventHandlers() {
  // Регистрация
  const regForm = document.querySelector('form[action=""]');
  if (regForm && regForm.querySelector('input[name="fio"]')) {
    regForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const userData = {
        login: this.login.value,
        password: this.password.value,
        fio: this.fio.value,
        phone: this.phone.value,
        email: this.mail.value,
        registrationDate: new Date().toLocaleString()
      };
      
      const result = registerUser(userData);
      showNotification(result.message, result.success ? 'success' : 'error');
      
      if (result.success) {
        setTimeout(() => {
          window.location.href = 'authorization.html';
        }, 1500);
      }
    });
  }
  
  // Авторизация
  const loginForm = document.querySelector('form[action=""]');
  if (loginForm && loginForm.querySelector('input[name="login"]') && 
      !loginForm.querySelector('input[name="fio"]')) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const login = this.login.value;
      const password = this.password.value;
      
      const result = loginUser(login, password);
      showNotification(result.message, result.success ? 'success' : 'error');
      
      if (result.success) {
        setTimeout(() => {
          const returnUrl = localStorage.getItem(STORAGE_KEYS.RETURN_URL) || 'index.html';
          window.location.href = returnUrl;
        }, 1500);
      }
    });
  }
  
  // Выход
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      logoutUser();
      showNotification('Вы успешно вышли из системы', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    });
  }
  
  // Добавление в корзину
  document.querySelectorAll('.service-form').forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const card = this.closest('.stylist-card');
      const serviceId = this.querySelector('input[name="service_id"]').value;
      const stylistId = this.querySelector('input[name="stylist_id"]').value;
      const price = this.querySelector('input[name="price"]').value;
      const serviceName = card.querySelector('.service-name').textContent;
      const stylistName = card.querySelector('h3').textContent;
      const serviceImage = card.querySelector('.stylist-photo img').src;
      
      const result = addToCart(serviceId, stylistId, price, serviceName, stylistName, serviceImage);
      if (result.success) {
        showNotification(result.message);
      }
    });
  });
  
  // Обновление профиля
  const profileLink = document.querySelector('.profile-link');
  if (profileLink) {
    if (checkAuth()) {
      profileLink.href = 'profil.html';
      profileLink.innerHTML = '<i class="ri-user-fill"></i>';
    } else {
      profileLink.href = 'authorization.html';
      profileLink.innerHTML = '<i class="ri-user-line"></i>';
    }
  }
}

// Основная функция инициализации
function init() {
  initStorage();
  updateCartCounter();
  initEventHandlers();
  
  if (window.location.pathname.includes('basket.html')) {
    initCartPage();
  }
  
  // Показываем уведомления из URL параметров
  const urlParams = new URLSearchParams(window.location.search);
  const message = urlParams.get('message');
  const messageType = urlParams.get('type');
  
  if (message) {
    showNotification(message, messageType || 'success');
  }
}

// Запускаем приложение при загрузке страницы
document.addEventListener('DOMContentLoaded', init);