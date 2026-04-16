// ---------------------------------------------------------------------------
// Annuaire des professionnels : vetos, toiletteurs, educateurs, etc.
// ---------------------------------------------------------------------------

import api from './client';

export const searchProsAPI = ({ type, lat, lng, radiusKm, q, limit } = {}) => {
  const params = {};
  if (type) params.type = type;
  if (typeof lat === 'number') params.lat = lat;
  if (typeof lng === 'number') params.lng = lng;
  if (radiusKm) params.radiusKm = radiusKm;
  if (q) params.q = q;
  if (limit) params.limit = limit;
  return api.get('/professionals', { params });
};

export const getProAPI = (id) => api.get(`/professionals/${id}`);
export const trackProContactAPI = (id) => api.post(`/professionals/${id}/contact`);
export const createProAPI = (payload) => api.post('/professionals', payload);
export const updateProAPI = (id, payload) => api.patch(`/professionals/${id}`, payload);
