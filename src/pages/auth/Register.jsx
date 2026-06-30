import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const registerSchema = z
  .object({
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export default function Register() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data) {
    setIsSubmitting(true);
    try {
      await registerUser(data.email, data.password);
      toast.success("Cuenta creada exitosamente");
      navigate("/dashboard");
    } catch (error) {
      console.error("[Auth] Register error:", error.code, error.message);
      const messages = {
        "auth/email-already-in-use": "Este correo ya está registrado",
        "auth/weak-password": "La contraseña es muy débil",
        "auth/invalid-email": "Correo electrónico inválido",
        "auth/too-many-requests": "Demasiados intentos. Intenta más tarde",
      };
      toast.error(messages[error.code] || "Error al crear la cuenta");
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
              autoComplete="new-password"
              {...register("password")}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-800 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-danger">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-800 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-danger">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Creando cuenta..." : "Crear Cuenta"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-medium text-primary transition-colors hover:text-primary-dark">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
