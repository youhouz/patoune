import api from './client';

export const scanProductAPI = (barcode) =>
  api.get(`/products/scan/${barcode}`);

export const addProductAPI = (productData) =>
  api.post('/products', productData);

export const getScanHistoryAPI = () =>
  api.get('/products/history');

export const searchProductsAPI = (query) =>
  api.get('/products/search', { params: query });
