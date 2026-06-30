export default function PageContainer({ title, description, children }) {
  return (
    <div className="mx-auto max-w-7xl">
      {(title || description) && (
        <div className="mb-6 sm:mb-8">
          {title && (
            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
              {title}
            </h1>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
