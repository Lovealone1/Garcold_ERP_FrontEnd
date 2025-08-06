import api from "@/lib/api";

interface LoginPayload {
  username: string;
  password: string;
}

export const login = async ({ username, password }: LoginPayload) => {
  const data = new URLSearchParams();
  data.append("username", username);
  data.append("password", password);
  console.log("API BASE URL:", process.env.NEXT_PUBLIC_API_URL);
  const response = await api.post("/auth/token", data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};