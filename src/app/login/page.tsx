"use client";

import "../../styles/login-circles.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/features/auth/services";
import Cookies from "js-cookie";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const response = await login({ username, password });
    
    // Guardar el token como cookie
    Cookies.set("access_token", response.access_token, {
      path: "/", 
      sameSite: "Lax",
    });

    router.push("/dashboard"); // Redirige al dashboard
  } catch (err) {
    setError("Usuario o contraseña incorrectos");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="relative min-h-screen flex">
      <div className="flex flex-col sm:flex-row items-center md:items-start sm:justify-center md:justify-start flex-auto min-w-0 bg-white">
        <div
          className="sm:w-1/2 xl:w-3/5 h-full hidden md:flex flex-auto items-center justify-center p-10 overflow-hidden bg-purple-900 text-white bg-no-repeat bg-cover relative"
          style={{
            backgroundImage:
              "url(https://img.freepik.com/free-vector/gradient-mountain-landscape_23-2149159772.jpg)",
          }}
        >
          <div className="absolute bg-gradient-to-b from-indigo-600 to-blue-500 opacity-75 inset-0 z-0"></div>
          <div className="w-full max-w-md z-10">
            <h1 className="sm:text-4xl xl:text-5xl font-bold leading-tight mb-6">
              Tienda Garcold
            </h1>
            <p className="sm:text-sm xl:text-md text-gray-200 font-normal">
              Sistema de ventas diseñado para la tienda "Garcold"
            </p>
          </div>
          <ul className="circles">
            {Array.from({ length: 10 }).map((_, i) => (
              <li key={i}></li>
            ))}
          </ul>
        </div>

        <div className="md:flex md:items-center md:justify-center w-full sm:w-auto md:h-full w-2/5 xl:w-2/5 p-8 md:p-10 lg:p-14 sm:rounded-lg md:rounded-none bg-white">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-bold text-gray-900">Bienvenido de nuevo</h2>
              <p className="mt-2 text-sm text-gray-500">Inicia sesión en tu cuenta</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="relative">
                <label className="ml-3 text-sm font-bold text-gray-700 tracking-wide">Usuario</label>
                <input
                  className="w-full text-base px-4 py-2 border-b border-gray-300 focus:outline-none focus:border-indigo-500"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="mt-8">
                <label className="ml-3 text-sm font-bold text-gray-700 tracking-wide">Contraseña</label>
                <input
                  className="w-full text-base px-4 py-2 border-b border-gray-300 focus:outline-none focus:border-indigo-500"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center text-sm text-gray-900">
                  <input
                    type="checkbox"
                    className="h-4 w-4 bg-blue-500 focus:ring-blue-400 border-gray-300 rounded"
                  />
                  <span className="ml-2">Recordarme</span>
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-blue-500 hover:to-indigo-600 text-white p-4 rounded-full tracking-wide font-semibold shadow-lg transition duration-500"
                >
                  Iniciar sesión
                </button>
              </div>

              {error && (
                <p className="text-red-500 mt-2 text-center text-sm font-medium">{error}</p>
              )}

              <p className="flex flex-col items-center justify-center mt-10 text-center text-md text-gray-500">
                
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
