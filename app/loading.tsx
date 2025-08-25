export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Chargement en cours...</p>
        <p className="text-gray-400 text-sm mt-2">Veuillez patienter</p>
      </div>
    </div>
  );
}
