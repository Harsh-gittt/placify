import { useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useDropzone } from "react-dropzone";
import { formatSize } from "../../lib/utils";

const FileUploader = ({ onFileSelect }) => {
  const { darkMode } = useTheme();
  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0] || null;
      onFileSelect?.(file);
    },
    [onFileSelect]
  );

  const maxFileSize = 20 * 1024 * 1024;

  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/pdf": [".pdf"] },
    maxSize: maxFileSize,
  });

  const file = acceptedFiles[0] || null;

  return (
    <div className="w-full gradient-border">
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <div className={`space-y-4 cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
          darkMode ? 'bg-[#121212]' : 'bg-white'
        } p-6 rounded-lg`}>
          {file ? (
            <div
              className={`uploader-selected-file flex items-center justify-between gap-4 animate-in fade-in zoom-in duration-500 ${
                darkMode ? 'bg-[#0a0a0a] border-gray-700' : 'bg-gray-50 border-gray-200'
              } border rounded-lg p-4`}
              onClick={(e) => e.stopPropagation()}
            >
              <img src="/images/pdf.png" alt="pdf" className="size-10 animate-in zoom-in duration-300" />
              <div className="flex items-center space-x-3 flex-1">
                <div>
                  <p className={`text-sm font-medium truncate max-w-xs ${
                    darkMode ? 'text-white' : 'text-gray-700'
                  }`}>
                    {file.name}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                className={`p-2 cursor-pointer rounded-lg transition-all duration-200 hover:scale-110 ${
                  darkMode 
                    ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' 
                    : 'hover:bg-red-100 text-gray-500 hover:text-red-600'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onFileSelect?.(null);
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                <img src="/icons/info.svg" alt="upload" className="size-20 animate-pulse" />
              </div>
              <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                PDF (max {formatSize(maxFileSize)})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
