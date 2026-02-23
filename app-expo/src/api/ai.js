// ---------------------------------------------------------------------------
// Patoune v2.0 - AI Assistant API
// Sends questions to the backend AI endpoint with optional pet context.
// ---------------------------------------------------------------------------

import api from './client';

/**
 * Send a question to the Patoune AI assistant.
 *
 * @param {string} question   - The user's question
 * @param {object} petContext  - Optional pet context ({ name, species, breed, age, weight })
 * @returns {Promise} Axios response with AI answer
 */
export const askAIAPI = (question, petContext) =>
  api.post('/ai/ask', { question, petContext });
