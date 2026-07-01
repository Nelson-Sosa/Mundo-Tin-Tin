import { useState, useEffect } from "react";
import { validateClient, ValidationError } from "../../services/clientService";

function buildInitial(initialData) {
  return initialData
    ? {
        name: initialData.name || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        address: initialData.address || "",
        notes: initialData.notes || "",
      }
    : { name: "", phone: "", email: "", address: "", notes: "" };
}

export default function ClientForm({ initialData, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(() => buildInitial(initialData));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    setForm(buildInitial(initialData));
    setErrors({});
    setTouched({});
  }, [initialData]);

  function handleChange(field, value) {
    const next = { ...form, [field]: value };
    setForm(next);

    if (touched[field]) {
      const { errors: fieldErrors } = validateClient(next);
      setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] || null }));
    }
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const { errors: allErrors } = validateClient(form);
    setErrors((prev) => ({ ...prev, [field]: allErrors[field] || null }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const { valid, errors: allErrors } = validateClient(form);
    setErrors(allErrors);
    setTouched({ name: true, phone: true, email: true, address: true, notes: true });

    if (!valid) return;

    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="client-name" className="block text-sm font-medium text-gray-700">
          Nombre completo <span className="text-danger">*</span>
        </label>
        <input
          id="client-name"
          type="text"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 ${
            errors.name
              ? "border-red-300 focus:border-red-400 focus:ring-red/20"
              : "border-gray-200 focus:border-primary focus:ring-primary/20"
          }`}
          placeholder="Ej: Juan Pérez"
          autoFocus
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="client-phone" className="block text-sm font-medium text-gray-700">
          Teléfono <span className="text-danger">*</span>
        </label>
        <input
          id="client-phone"
          type="text"
          inputMode="tel"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          onBlur={() => handleBlur("phone")}
          className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 ${
            errors.phone
              ? "border-red-300 focus:border-red-400 focus:ring-red/20"
              : "border-gray-200 focus:border-primary focus:ring-primary/20"
          }`}
          placeholder="Ej: 0981123456"
        />
        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="client-email" className="block text-sm font-medium text-gray-700">
          Correo electrónico
        </label>
        <input
          id="client-email"
          type="email"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 ${
            errors.email
              ? "border-red-300 focus:border-red-400 focus:ring-red/20"
              : "border-gray-200 focus:border-primary focus:ring-primary/20"
          }`}
          placeholder="ej: juan@email.com"
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="client-address" className="block text-sm font-medium text-gray-700">
          Dirección
        </label>
        <input
          id="client-address"
          type="text"
          value={form.address}
          onChange={(e) => handleChange("address", e.target.value)}
          onBlur={() => handleBlur("address")}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Dirección opcional"
        />
      </div>

      <div>
        <label htmlFor="client-notes" className="block text-sm font-medium text-gray-700">
          Observaciones
        </label>
        <textarea
          id="client-notes"
          rows={3}
          value={form.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          onBlur={() => handleBlur("notes")}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          placeholder="Observaciones opcionales"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {loading
            ? "Guardando..."
            : initialData
            ? "Guardar cambios"
            : "Registrar cliente"}
        </button>
      </div>
    </form>
  );
}
