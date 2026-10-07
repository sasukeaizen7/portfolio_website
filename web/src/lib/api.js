// Same-origin API: Vite (dev) and Vercel (prod) forward /api to the NestJS server.
// The admin session is an httpOnly cookie; writes carry a header a cross-site form can't set.
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, { json, form } = {}) {
  const headers = {};
  if (method !== 'GET') headers['X-Portfolio-Client'] = 'web';
  let body;
  if (form) body = form;
  else if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  }
  const res = await fetch(`/api${path}`, { method, headers, body, credentials: 'same-origin' });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join('\n') : data?.message || res.statusText;
    throw new ApiError(message, res.status);
  }
  return data;
}

export const api = {
  projects: () => request('GET', '/projects'),
  profile: () => request('GET', '/profile'),

  me: () => request('GET', '/auth/me'),
  login: (email, password) => request('POST', '/auth/login', { json: { email, password } }),
  logout: () => request('POST', '/auth/logout'),

  adminProjects: () => request('GET', '/admin/projects'),
  createProject: (input) => request('POST', '/admin/projects', { json: input }),
  updateProject: (id, input) => request('PATCH', `/admin/projects/${id}`, { json: input }),
  deleteProject: (id) => request('DELETE', `/admin/projects/${id}`),
  updateProfile: (input) => request('PUT', '/admin/profile', { json: input }),
  uploadImage: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('POST', '/admin/images', { form });
  },
};
