import { useState, useEffect, useMemo } from "react";
import { Plus, DollarSign, Receipt, TrendingUp, Clock, Calendar } from "lucide-react";
import toast from "react-hot-toast";

import * as gastoService from "../../services/gastoOperativoService";
import { formatCurrency } from "../../utils/formatCurrency";
import PageContainer from "../../components/layout/PageContainer";

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GastosOperativos() {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [nombreGasto, setNombreGasto] = useState("");
  const [monto, setMonto] = useState("");
  const [errors, setErrors] = useState({});

  async function loadGastos() {
    setLoading(true);
    try {
      const data = await gastoService.getGastos();
      setGastos(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGastos();
  }, []);

  const todayTotal = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return gastos
      .filter((g) => {
        const d = g.fecha?.toDate?.() || new Date(0);
        return d.getTime() >= startOfDay;
      })
      .reduce((sum, g) => sum + (g.monto || 0), 0);
  }, [gastos]);

  const weekTotal = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const startOfWeek = monday.getTime();
    return gastos
      .filter((g) => {
        const d = g.fecha?.toDate?.() || new Date(0);
        return d.getTime() >= startOfWeek;
      })
      .reduce((sum, g) => sum + (g.monto || 0), 0);
  }, [gastos]);

  const monthTotal = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return gastos
      .filter((g) => {
        const d = g.fecha?.toDate?.() || new Date(0);
        return d.getTime() >= startOfMonth;
      })
      .reduce((sum, g) => sum + (g.monto || 0), 0);
  }, [gastos]);

  async function handleSubmit(e) {
    e.preventDefault();
    const { valid, errors: errs } = gastoService.validateGasto({ nombreGasto, monto });
    setErrors(errs);
    if (!valid) return;

    setSubmitting(true);
    try {
      await gastoService.createGasto({ nombreGasto, monto });
      toast.success("Gasto registrado");
      setNombreGasto("");
      setMonto("");
      setErrors({});
      loadGastos();
    } catch {
      toast.error("Error al registrar el gasto");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer title="Gastos Operativos" description="Registrá los gastos diarios del negocio">
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        {/* Form + summary */}
        <div className="space-y-6 lg:col-span-2">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border transition-all hover:shadow-md">
              <div className="h-1 w-full bg-rose-500" />
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-500 sm:text-sm">Gastos de hoy</p>
                    <p className="mt-1.5 text-lg font-bold tracking-tight text-gray-800 sm:text-xl">
                      {formatCurrency(todayTotal)}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 sm:h-12 sm:w-12">
                    <Clock className="h-5 w-5 text-rose-500 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border transition-all hover:shadow-md">
              <div className="h-1 w-full bg-primary" />
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-500 sm:text-sm">Gastos de la semana</p>
                    <p className="mt-1.5 text-lg font-bold tracking-tight text-gray-800 sm:text-xl">
                      {formatCurrency(weekTotal)}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light sm:h-12 sm:w-12">
                    <TrendingUp className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border transition-all hover:shadow-md">
              <div className="h-1 w-full bg-rose-500" />
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-500 sm:text-sm">Gastos del mes</p>
                    <p className="mt-1.5 text-lg font-bold tracking-tight text-gray-800 sm:text-xl">
                      {formatCurrency(monthTotal)}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 sm:h-12 sm:w-12">
                    <Calendar className="h-5 w-5 text-rose-500 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-border sm:p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Receipt className="h-4 w-4 text-primary" />
              Nuevo gasto
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="nombreGasto" className="block text-sm font-medium text-gray-700">
                  Nombre del gasto <span className="text-danger">*</span>
                </label>
                <input
                  id="nombreGasto"
                  type="text"
                  value={nombreGasto}
                  onChange={(e) => setNombreGasto(e.target.value)}
                  placeholder="Ej: Combustible, Delivery, Internet..."
                  className={`mt-1 block w-full rounded-lg border px-4 py-2 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 sm:py-2.5 ${
                    errors.nombreGasto
                      ? "border-red-300 focus:border-red-400 focus:ring-red/20"
                      : "border-gray-200 focus:border-primary focus:ring-primary/20"
                  }`}
                  autoFocus
                />
                {errors.nombreGasto && (
                  <p className="mt-1 text-xs text-red-500">{errors.nombreGasto}</p>
                )}
              </div>

              <div>
                <label htmlFor="monto" className="block text-sm font-medium text-gray-700">
                  Monto (Gs.) <span className="text-danger">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    id="monto"
                    type="text"
                    inputMode="numeric"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="Ej: 50000"
                    className={`block w-full rounded-lg border px-4 py-2 pr-12 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 sm:py-2.5 ${
                      errors.monto
                        ? "border-red-300 focus:border-red-400 focus:ring-red/20"
                        : "border-gray-200 focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    Gs.
                  </span>
                </div>
                {errors.monto && (
                  <p className="mt-1 text-xs text-red-500">{errors.monto}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:py-2.5"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Agregar gasto
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Gastos list */}
        <div className="lg:col-span-3">
          <div className="rounded-xl bg-white shadow-sm ring-1 ring-border">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5 sm:py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <DollarSign className="h-4 w-4 text-primary" />
                Gastos registrados
              </h3>
              <span className="text-xs text-gray-400">{gastos.length} registro{gastos.length !== 1 ? "s" : ""}</span>
            </div>

            {loading ? (
              <div className="space-y-3 p-4 sm:p-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 sm:h-14" />
                ))}
              </div>
            ) : gastos.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center sm:py-12">
                <Receipt className="h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">No hay gastos registrados</p>
                <p className="text-xs text-gray-400">Usá el formulario para registrar tu primer gasto</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {gastos.map((gasto) => (
                  <li key={gasto.id} className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50/50 sm:px-5 sm:py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">{gasto.nombreGasto}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {gasto.fecha ? formatDateShort(gasto.fecha) : formatDateShort(gasto.createdAt)}
                      </p>
                    </div>
                    <div className="ml-3 shrink-0 text-right sm:ml-4">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(gasto.monto)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
