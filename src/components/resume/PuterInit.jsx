import { useEffect } from "react";
import usePuterStore from "../../lib/puter";

export function PuterInit() {
  const { init, isLoading, error } = usePuterStore();

  useEffect(() => {
    init();
  }, [init]);

  // Only show loading/error states, no authentication required
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Loading...</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Please wait while we initialize the resume analyzer...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Error</h2>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return null;
}
