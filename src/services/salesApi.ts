import api from "./api";

const SALES_PREFIX = "/sales-api/v1";
const base = (api.defaults.baseURL ?? "").replace(/\/+$/g, "");
const hasPrefixInBase = base.endsWith(SALES_PREFIX);

const prefix = hasPrefixInBase ? "" : SALES_PREFIX; 
const norm = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${prefix}${p}`;
};

const salesApi = {
  get: (url: string, config = {}) => api.get(norm(url), config),
  post: (url: string, data?: any, config = {}) => api.post(norm(url), data, config),
  put: (url: string, data?: any, config = {}) => api.put(norm(url), data, config),
  patch: (url: string, data?: any, config = {}) => api.patch(norm(url), data, config),
  delete: (url: string, config = {}) => api.delete(norm(url), config),
};

export default salesApi;
