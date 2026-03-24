import api from './client';

export const getDashboardAPI = () => api.get('/admin/dashboard');
export const getUsersAPI = (params) => api.get('/admin/users', { params });
export const getVisitorAnalyticsAPI = (days) => api.get('/admin/analytics/visitors', { params: { days } });
export const getFeedbacksAPI = () => api.get('/admin/analytics/feedbacks');
export const updateFeedbackStatusAPI = (id, status) => api.put(`/admin/analytics/feedbacks/${id}`, { status });
export const getSubscribersAPI = () => api.get('/admin/subscribers');
