export default function QuickActionCard({ icon: Icon, title, description, disabled }) {
  return (
    <button
      disabled={disabled}
      className={`group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all sm:p-5 ${
        disabled
          ? "border-border bg-white/50 cursor-not-allowed opacity-60"
          : "border-border bg-white shadow-sm hover:border-primary/30 hover:shadow-md active:scale-[0.98] cursor-pointer"
      }`}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${
        disabled ? "bg-gray-100" : "bg-primary-light group-hover:bg-primary/10"
      }`}>
        <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${disabled ? "text-gray-400" : "text-primary"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold sm:text-base ${disabled ? "text-gray-500" : "text-gray-800"}`}>
          {title}
        </p>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">{description}</p>
        )}
      </div>
    </button>
  );
}
