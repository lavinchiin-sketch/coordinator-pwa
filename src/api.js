// src/api.js — talks to the INTERNet v2 backend. No public register: accounts
// are created by the coordinator. Every list endpoint returns { data, total, page, limit, pages }.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const FILE_BASE = API_BASE.replace(/\/api\/?$/, '');

function getToken() { return localStorage.getItem('internet_token'); }
function setToken(t) { t ? localStorage.setItem('internet_token', t) : localStorage.removeItem('internet_token'); }
function getUser() { const r = localStorage.getItem('internet_user'); return r ? JSON.parse(r) : null; }
function setUser(u) { u ? localStorage.setItem('internet_user', JSON.stringify(u)) : localStorage.removeItem('internet_user'); }
// Absolute URL for a file path the backend returned (e.g. "/uploads/xyz.jpg").
const fileUrl = (path) => (path ? (path.startsWith('http') ? path : `${FILE_BASE}${path}`) : null);

async function request(path, { method = 'GET', body, isForm = false, auth = true } = {}) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (auth) { const t = getToken(); if (t) headers['Authorization'] = `Bearer ${t}`; }
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { method, headers, body: isForm ? body : body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Check your internet connection or try again in a moment.');
  }
  let data; try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    // Session expired/invalid (and not just a wrong-password attempt on the login screen itself):
    // clear it and send the person back to Login instead of leaving them stuck on error banners.
    if (res.status === 401 && auth && getToken()) {
      setToken(null); setUser(null);
      window.location.reload();
    }
    const err = new Error((data && data.message) || `Request failed (${res.status})`);
    err.code = data && data.code; err.status = res.status;
    throw err;
  }
  return data;
}
const qs = (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : '';
};

export const api = {
  // Auth
  login: (identifier, password) => request('/auth/login', { method: 'POST', body: { identifier, password }, auth: false }),
  me: () => request('/auth/me'),
  updateMe: (payload) => request('/auth/me', { method: 'PATCH', body: payload }),
  changePassword: (current_password, new_password) => request('/auth/change-password', { method: 'POST', body: { current_password, new_password } }),

  // Users (coordinator)
  listUsers: (params) => request(`/users${qs(params)}`),
  createSupervisor: (payload) => request('/users/supervisors', { method: 'POST', body: payload }),
  createCoordinator: (payload) => request('/users/coordinators', { method: 'POST', body: payload }),
  updateUser: (id, payload) => request(`/users/${id}`, { method: 'PATCH', body: payload }),
  resetPassword: (id, payload = {}) => request(`/users/${id}/reset-password`, { method: 'POST', body: payload }),

  // Students
  getMyStudent: () => request('/students/me'),
  setIntent: (intent) => request('/students/me/intent', { method: 'POST', body: { intent } }),
  listPrograms: () => request('/students/programs'),
  importStudents: (rows, opts) => request('/students/import', { method: 'POST', body: { rows, ...opts } }),
  listStudents: (params) => request(`/students${qs(params)}`),
  createStudent: (payload) => request('/students', { method: 'POST', body: payload }),
  getStudent: (id) => request(`/students/${id}`),
  updateStudent: (id, payload) => request(`/students/${id}`, { method: 'PATCH', body: payload }),
  setStudentStatus: (id, ojt_status) => request(`/students/${id}/status`, { method: 'PATCH', body: { ojt_status } }),

  // Terms & companies
  listTerms: () => request('/terms'),
  createTerm: (payload) => request('/terms', { method: 'POST', body: payload }),
  activateTerm: (id) => request(`/terms/${id}/activate`, { method: 'POST' }),
  listCompanies: (params) => request(`/companies${qs(params)}`),
  getCompany: (id) => request(`/companies/${id}`),
  createCompany: (payload) => request('/companies', { method: 'POST', body: payload }),
  updateCompany: (id, payload) => request(`/companies/${id}`, { method: 'PATCH', body: payload }),

  // Placements
  submitPlacement: (formData) => request('/placements', { method: 'POST', body: formData, isForm: true }),
  myPlacements: () => request('/placements/mine'),
  cancelPlacement: (id) => request(`/placements/${id}/cancel`, { method: 'POST' }),
  listPlacements: (params) => request(`/placements${qs(params)}`),
  assignPlacements: (payload) => request('/placements/assign', { method: 'POST', body: payload }),
  approvePlacement: (id, payload) => request(`/placements/${id}/approve`, { method: 'POST', body: payload }),
  rejectPlacement: (id, reviewer_remarks) => request(`/placements/${id}/reject`, { method: 'POST', body: { reviewer_remarks } }),

  // Attendance
  getToday: () => request('/daily-reports/today'),
  timeIn: (formData) => request('/daily-reports/time-in', { method: 'POST', body: formData, isForm: true }),
  timeOut: (formData) => request('/daily-reports/time-out', { method: 'POST', body: formData, isForm: true }),
  myReports: (params) => request(`/daily-reports/mine${qs(params)}`),
  listReports: (params) => request(`/daily-reports${qs(params)}`),
  reviewReport: (id, status, remarks) => request(`/daily-reports/${id}/review`, { method: 'PATCH', body: { status, remarks } }),
  reviewReportsBulk: (ids, status, remarks) => request('/daily-reports/review-bulk', { method: 'POST', body: { ids, status, remarks } }),

  // Tasks
  createTasks: (payload) => request('/tasks', { method: 'POST', body: payload }),
  listTasks: (params) => request(`/tasks${qs(params)}`),
  getTask: (id) => request(`/tasks/${id}`),
  submitTask: (id, formData) => request(`/tasks/${id}/submit`, { method: 'POST', body: formData, isForm: true }),
  reviewSubmission: (id, review_status, feedback) => request(`/tasks/submissions/${id}/review`, { method: 'PATCH', body: { review_status, feedback } }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // Requirements & documents
  listRequirements: (params) => request(`/requirements${qs(params)}`),
  createRequirement: (payload) => request('/requirements', { method: 'POST', body: payload }),
  updateRequirement: (id, payload) => request(`/requirements/${id}`, { method: 'PATCH', body: payload }),
  myChecklist: () => request('/documents/mine'),
  uploadDocument: (formData) => request('/documents', { method: 'POST', body: formData, isForm: true }),
  listDocuments: (params) => request(`/documents${qs(params)}`),
  studentDocuments: (studentId) => request(`/documents/student/${studentId}`),
  reviewDocument: (id, status, remarks) => request(`/documents/${id}/review`, { method: 'PATCH', body: { status, remarks } }),

  // Complaints
  fileComplaint: (formData) => request('/complaints', { method: 'POST', body: formData, isForm: true }),
  listComplaints: (params) => request(`/complaints${qs(params)}`),
  updateComplaint: (id, status, resolution_notes) => request(`/complaints/${id}`, { method: 'PATCH', body: { status, resolution_notes } }),

  // Evaluations
  getCriteria: () => request('/evaluations/criteria'),
  submitEvaluation: (payload) => request('/evaluations', { method: 'POST', body: payload }),
  listEvaluations: (params) => request(`/evaluations${qs(params)}`),

  // Notifications
  listNotifications: (params) => request(`/notifications${qs(params)}`),
  unreadCount: () => request('/notifications/unread-count'),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),

  // Dashboards
  coordinatorDashboard: () => request('/dashboard/coordinator'),
  reportsData: () => request('/dashboard/reports'),
  supervisorDashboard: () => request('/dashboard/supervisor'),
  studentDashboard: () => request('/dashboard/student'),
};

export const auth = { getToken, setToken, getUser, setUser };
export { fileUrl };
