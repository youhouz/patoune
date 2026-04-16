// ---------------------------------------------------------------------------
// Carnet de sante numerique de l'animal.
// ---------------------------------------------------------------------------

import api from './client';

export const getHealthAPI         = (petId) => api.get(`/pets/${petId}/health`);
export const updateHealthInfoAPI  = (petId, payload) => api.patch(`/pets/${petId}/health`, payload);
export const addVaccineAPI        = (petId, vaccine) => api.post(`/pets/${petId}/health/vaccines`, vaccine);
export const deleteVaccineAPI     = (petId, vaccineId) => api.delete(`/pets/${petId}/health/vaccines/${vaccineId}`);
export const addDewormingAPI      = (petId, dew) => api.post(`/pets/${petId}/health/dewormings`, dew);
export const addWeightAPI         = (petId, payload) => api.post(`/pets/${petId}/health/weights`, payload);
export const addTreatmentAPI      = (petId, treatment) => api.post(`/pets/${petId}/health/treatments`, treatment);
export const rotateShareTokenAPI  = (petId) => api.post(`/pets/${petId}/health/share/rotate`);
export const getPublicHealthAPI   = (token) => api.get(`/pets/public-health/${token}`);
