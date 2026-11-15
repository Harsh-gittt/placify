const defaultApiBaseUrl = import.meta.env.PROD
  ? "https://frosty-satellite-1647.de.deplexo.com"
  : "http://localhost:3000";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl
).replace(/\/+$/, "");
