import axios from "axios";
import { supabase } from "@/lib/supabase/client";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, 
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
