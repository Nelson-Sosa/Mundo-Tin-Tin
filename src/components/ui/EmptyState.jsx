export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 sm:py-20">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light sm:h-20 sm:w-20">
        <Icon className="h-6 w-6 text-primary sm:h-10 sm:w-10" />
      </div>
      <h3 className="mt-3 sm:mt-5 text-sm sm:text-base font-semibold text-gray-800">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-center text-xs sm:text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4 sm:mt-6">{action}</div>}
    </div>
  );
}
