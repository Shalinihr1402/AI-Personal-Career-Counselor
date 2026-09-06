/** Base URL of the FastAPI backend. Override with VITE_API_BASE if it runs elsewhere. */
export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:8000';
