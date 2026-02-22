import api from './client';

export const searchPetSittersAPI = (params) =>
  api.get('/petsitters', { params });

export const getPetSitterAPI = (id) =>
  api.get(`/petsitters/${id}`);

export const becomePetSitterAPI = (data) =>
  api.post('/petsitters', data);

export const updatePetSitterAPI = (data) =>
  api.put('/petsitters/me', data);

export const createBookingAPI = (data) =>
  api.post('/bookings', data);

export const getMyBookingsAPI = () =>
  api.get('/bookings');

export const updateBookingStatusAPI = (id, status) =>
  api.put(`/bookings/${id}/status`, { status });

export const createReviewAPI = (data) =>
  api.post('/reviews', data);

export const getPetSitterReviewsAPI = (id) =>
  api.get(`/reviews/petsitter/${id}`);
