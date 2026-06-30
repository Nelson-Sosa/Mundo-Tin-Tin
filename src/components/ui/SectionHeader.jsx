export default function SectionHeader({ title, description, action }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-gray-600">{description}</p>
        )}
      </div>
      {action && <div className="mt-2 sm:mt-0">{action}</div>}
    </div>
  );
}
