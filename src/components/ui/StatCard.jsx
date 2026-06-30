import { formatCurrency } from "../../utils/formatCurrency";

export default function StatCard({ title, value, icon: Icon, accent = "primary", kind = "number" }) {
  const isPlaceholder = value === null || value === undefined;

  const variant =
    accent === "rose"
      ? { circle: "bg-rose-100", icon: "text-rose-500", bar: "bg-rose-500" }
      : { circle: "bg-primary-light", icon: "text-primary", bar: "bg-primary" };

  function format(val) {
    if (isPlaceholder) return "—";
    if (typeof val === "number") {
      if (kind === "currency") return formatCurrency(val);
      return val.toLocaleString("es-PY");
    }
    return val;
  }

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border transition-all hover:shadow-md">
      <div className={`h-1 w-full ${variant.bar}`} />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
            <p
              className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${
                isPlaceholder ? "text-gray-300" : "text-gray-800"
              }`}
            >
              {isPlaceholder ? (
                <span className="text-base font-normal text-gray-400">—</span>
              ) : (
                format(value)
              )}
            </p>
          </div>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${variant.circle} sm:h-14 sm:w-14`}>
            <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${variant.icon}`} />
          </div>
        </div>
        {isPlaceholder && (
          <p className="mt-3 text-[11px] text-gray-500 leading-relaxed">
            Conecta Firestore para mostrar datos
          </p>
        )}
      </div>
    </div>
  );
}
