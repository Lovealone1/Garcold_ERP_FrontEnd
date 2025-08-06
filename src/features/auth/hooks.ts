import { useRouter } from "next/navigation";

export const useLogout = () => {
  const router = useRouter();
  return () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };
};