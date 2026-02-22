import api from './client';

export const getMyPetsAPI = () =>
  api.get('/pets');

export const addPetAPI = (petData) =>
  api.post('/pets', petData);

export const updatePetAPI = (id, petData) =>
  api.put(`/pets/${id}`, petData);

export const deletePetAPI = (id) =>
  api.delete(`/pets/${id}`);
