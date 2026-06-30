export default function CategoriesFilter({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500">Filtrar:</span>
      {["all", "active", "inactive"].map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            value === opt
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {opt === "all" ? "Todas" : opt === "active" ? "Activas" : "Inactivas"}
        </button>
      ))}
    </div>
  );
}
