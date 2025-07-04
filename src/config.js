// config.js - конфигурация API
const config = {
  development: {
    apiUrl: process.env.REACT_APP_API_URL || 'https://rgszh-miniapp.org'
  },
  production: {
    apiUrl: '' // относительные пути для продакшена
  }
};

export const API_BASE_URL = config[process.env.NODE_ENV]?.apiUrl || '';

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`🌐 API call: ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};