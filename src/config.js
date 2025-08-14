// src/config.js - ИСПРАВЛЕНО: изменен порт с 5000 на 4000

// Определяем среду автоматически
const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProductionDomain = window.location.hostname === 'rgszh-miniapp.org';

// Настройка API URL в зависимости от среды
export const API_BASE_URL = (() => {
  if (isLocalDevelopment) {
    // Локальная разработка - ИЗМЕНЕНО с 5000 на 4000
    return 'http://localhost:4000';
  } else if (isProductionDomain) {
    // Продакшн домен
    return 'https://rgszh-miniapp.org';
  } else {
    // Fallback для других доменов
    return 'https://rgszh-miniapp.org';
  }
})();

console.log('🌐 Environment detected:', {
  hostname: window.location.hostname,
  isLocal: isLocalDevelopment,
  isProduction: isProductionDomain,
  apiUrl: API_BASE_URL
});

export const apiCall = async (endpoint, options = {}) => {
  // ПРИНУДИТЕЛЬНО используем localhost для тестирования - ИЗМЕНЕНО с 5000 на 4000
  const apiUrl = isLocalDevelopment ? 'http://localhost:4000' : API_BASE_URL;
  
  const url = `${apiUrl}${endpoint}`;
  console.log('🌐 API call:', url);
  
  if (options.body) {
    console.log('📦 Request options:', {
      method: options.method,
      headers: options.headers,
      bodyLength: options.body?.length || 0
    });
  }
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  console.log('📡 Response status:', response.status);
  console.log('📄 Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    // Попробуем получить текст ответа один раз
    try {
      const responseText = await response.text();
      console.log('❌ Error response body:', responseText);
      
      // Попробуем распарсить как JSON
      try {
        const errorData = JSON.parse(responseText);
        console.log('📋 Parsed error data:', errorData);
        
        if (errorData.error) {
          // Извлекаем только текст ошибки
          throw new Error(errorData.error);
        }
        // Если в JSON есть сообщение об ошибке в другом поле
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        // Если в JSON нет понятного поля ошибки, используем стандартное сообщение
        throw new Error(`HTTP error! status: ${response.status}`);
      } catch (jsonError) {
        console.log('📋 JSON parse error:', jsonError);
        // Если не удалось распарсить JSON, используем стандартное сообщение
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (textError) {
      console.log('❌ Could not read response body:', textError);
      // Если это уже Error с нашим сообщением, перебрасываем его
      if (textError instanceof Error && textError.message !== `HTTP error! status: ${response.status}`) {
        throw textError;
      }
      // Иначе используем стандартное сообщение
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
  
  return response.json();
};