// src/config.js - ИСПРАВЛЕНО: убрана неиспользуемая функция

// Определяем среду автоматически
const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProductionDomain = window.location.hostname === 'rgszh-miniapp.org';

// Настройка API URL в зависимости от среды
export const API_BASE_URL = (() => {
  if (isLocalDevelopment) {
    // Локальная разработка - ИЗМЕНЕНО с 4000 на 5000
    return 'http://localhost:5000';
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
  // ПРИНУДИТЕЛЬНО используем localhost для тестирования - ИЗМЕНЕНО с 4000 на 5000
  const apiUrl = isLocalDevelopment ? 'http://localhost:5000' : API_BASE_URL;
  
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
    const errorText = await response.text();
    console.log('❌ Error response body:', errorText);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};