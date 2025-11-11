import { useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import usePuterStore from "../../lib/puter";

export function PuterInit() {
  const { darkMode } = useTheme();
  const { init, isLoading, error } = usePuterStore();

  useEffect(() => {
    init();
  }, [init]);

  // Only show loading/error states, no authentication required
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
        <div className={`${
          darkMode ? 'bg-[#0a0a0a] border-gray-800' : 'bg-white'
        } border p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in duration-500`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Loading...
            </h2>
          </div>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Please wait while we initialize the resume analyzer...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
        <div className={`${
          darkMode ? 'bg-[#0a0a0a] border-gray-800' : 'bg-white'
        } border p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in duration-500`}>
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Error
          </h2>
          <p className={`mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className={`transition-all duration-200 hover:scale-105 active:scale-95 ${
              darkMode 
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30' 
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'
            } font-semibold px-4 py-2 rounded-xl`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return null;
}
