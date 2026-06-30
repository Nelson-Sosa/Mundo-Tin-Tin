import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export default function Login() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data) {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      toast.success("Inicio de sesión exitoso");
      navigate("/dashboard");
    } catch (error) {
      console.error("[Auth] Login error:", error.code, error.message);
      const messages = {
        "auth/user-not-found": "No hay cuenta registrada con este correo",
        "auth/wrong-password": "Contraseña incorrecta",
        "auth/invalid-credential": "Credenciales inválidas",
        "auth/invalid-email": "Correo electrónico inválido",
        "auth/user-disabled": "Esta cuenta ha sido deshabilitada",
        "auth/too-many-requests": "Demasiados intentos. Intenta más tarde",
      };
      toast.error(messages[error.code] || "Error al iniciar sesión");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-sm ring-1 ring-primary-soft">
        <div className="text-center">
          <img
            src="/logoMundoTIN-TIN-sinFodno.png"
            alt="Mundo TIN-TIN"
            className="mx-auto h-16 w-auto sm:h-20"
          />
          <h1 className="mt-4 text-xl font-bold text-gray-800 sm:text-2xl">
            Mundo TIN-TIN
          </h1>
          <p className="text-sm text-gray-500">Sistema de gestión</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-800 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="correo@ejemplo.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-danger">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-800 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-danger">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-primary-soft" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-400">O continúa con</span>
          </div>
        </div>

        <button
          type="button"
          disabled={isGoogleSubmitting}
          onClick={async () => {
            setIsGoogleSubmitting(true);
            try {
              await loginWithGoogle();
              toast.success("Inicio de sesión exitoso");
              navigate("/dashboard");
            } catch (error) {
              if (error.code !== "auth/popup-closed-by-user") {
                toast.error("Error al iniciar sesión con Google");
              }
            } finally {
              setIsGoogleSubmitting(false);
            }
          }}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-primary-light hover:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {isGoogleSubmitting ? "Conectando..." : "Continuar con Google"}
        </button>

        <p className="text-center text-sm text-gray-500">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="font-medium text-primary transition-colors hover:text-primary-dark">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
