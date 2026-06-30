export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 sm:py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light sm:h-20 sm:w-20">
        <Icon className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-gray-800">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-center text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
