// ---------------------------------------------------------------------------
// Comparateur d'assurance animale (affiliation).
// ---------------------------------------------------------------------------

import api from './client';

export const listInsurancePartnersAPI = () => api.get('/insurance/partners');
export const trackInsuranceClickAPI = ({ partner, animalSpecies, animalAge, source } = {}) =>
  api.post('/insurance/click', { partner, animalSpecies, animalAge, source });
