import api from './client';

export const scanProductAPI = (barcode) =>
  api.get(`/products/scan/${barcode}`);

export const addProductAPI = (productData) =>
  api.post('/products', productData);

export const getScanHistoryAPI = () =>
  api.get('/products/history');

export const searchProductsAPI = (query) =>
  api.get('/products/search', { params: query });

export const getPopularProductsAPI = (limit = 12) =>
  api.get('/products/popular', { params: { limit } });

export const getCommunityStatsAPI = () =>
  api.get('/products/community-stats');

export const getAlternativesAPI = (productId) =>
  api.get(`/products/${productId}/alternatives`);

export const getLeaderboardAPI = () =>
  api.get('/products/leaderboard');

export const getMonthlyLeaderboardAPI = () =>
  api.get('/products/monthly-leaderboard');

export const toggleFavoriteAPI = (productId) =>
  api.post(`/products/${productId}/favorite`);

export const getFavoritesAPI = () =>
  api.get('/products/favorites');

export const getWeeklySummaryAPI = () =>
  api.get('/products/weekly-summary');

export const getPublicProductAPI = (barcode) =>
  api.get(`/products/public/${barcode}`);
