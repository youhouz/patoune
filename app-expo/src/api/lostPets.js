// ---------------------------------------------------------------------------
// Alerte Animal Perdu — signalement + recherche geolocalisee + apercu.
// ---------------------------------------------------------------------------

import api from './client';

export const listLostPetsAPI = ({ lat, lng, radiusKm, species, status } = {}) => {
  const params = {};
  if (typeof lat === 'number') params.lat = lat;
  if (typeof lng === 'number') params.lng = lng;
  if (radiusKm) params.radiusKm = radiusKm;
  if (species) params.species = species;
  if (status) params.status = status;
  return api.get('/lost-pets', { params });
};

export const getLostPetAPI = (id) => api.get(`/lost-pets/${id}`);
export const getPublicLostPetAPI = (shareToken) => api.get(`/lost-pets/public/${shareToken}`);
export const getMyLostPetsAPI = () => api.get('/lost-pets/mine');
export const createLostPetAPI = (payload) => api.post('/lost-pets', payload);
export const addSightingAPI = (id, payload) => api.post(`/lost-pets/${id}/sightings`, payload);
export const setLostPetStatusAPI = (id, status) => api.patch(`/lost-pets/${id}/status`, { status });
