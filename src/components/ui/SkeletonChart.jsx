export default function SkeletonChart({ title }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-6">
        <div className="flex items-end justify-between gap-2 sm:gap-3" aria-hidden="true">
          {[40, 65, 45, 80, 55, 90, 70, 50, 75, 60, 85, 95].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-gradient-to-t from-primary/10 to-primary/5"
              style={{ height: `${h}%`, minHeight: "24px", maxHeight: "160px" }}
            />
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            Los gráficos estarán disponibles cuando existan datos suficientes.
          </p>
        </div>
      </div>
    </div>
  );
}
