import { ErrorLevel, ErrorSource } from '@/features/vfs/store/vfs-store';
import { useVfsErrors } from '@/hooks/use-vfs-errors';
import React from 'react';

interface ErrorDisplayProps {
  maxErrors?: number;
  showControls?: boolean;
}

export const VfsErrorDisplay: React.FC<ErrorDisplayProps> = ({
  maxErrors = 5,
  showControls = true,
}) => {
  const {
    filteredErrors,
    hasErrors,
    lastError,
    clearErrors,
    filterSource,
    filterLevel,
    setFilterSource,
    setFilterLevel,
    clearFilters,
  } = useVfsErrors();

  if (!hasErrors) {
    return null;
  }

  // Get errors to display (most recent first)
  const errorsToDisplay = filteredErrors
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, maxErrors);

  return (
    <div className="vfs-error-container bg-red-50 border border-red-200 rounded-md p-4 my-2">
      <div className="flex justify-between items-center border-b border-red-200 pb-2 mb-2">
        <h3 className="text-red-800 font-semibold">VFS Errors ({filteredErrors.length})</h3>
        {showControls && (
          <div className="flex gap-2">
            <button
              onClick={clearErrors}
              className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
            >
              Clear All
            </button>
            <button
              onClick={clearFilters}
              className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {showControls && (
        <div className="flex gap-4 mb-3">
          <div>
            <label className="block text-sm text-red-700 mb-1">Source:</label>
            <select
              value={filterSource || ''}
              onChange={e =>
                setFilterSource(e.target.value ? (e.target.value as ErrorSource) : null)
              }
              className="text-sm border border-red-200 rounded p-1"
            >
              <option value="">All Sources</option>
              <option value="vfs">VFS</option>
              <option value="workflow">Workflow</option>
              <option value="service">Service</option>
              <option value="node">Node</option>
              <option value="edge">Edge</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-red-700 mb-1">Level:</label>
            <select
              value={filterLevel || ''}
              onChange={e => setFilterLevel(e.target.value ? (e.target.value as ErrorLevel) : null)}
              className="text-sm border border-red-200 rounded p-1"
            >
              <option value="">All Levels</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>
      )}

      <div className="error-list">
        {errorsToDisplay.length > 0 ? (
          <ul className="space-y-2">
            {errorsToDisplay.map((error, index) => (
              <li key={index} className="bg-white p-2 rounded border border-red-100 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${
                      error.level === 'error'
                        ? 'text-red-600'
                        : error.level === 'warn'
                          ? 'text-amber-600'
                          : 'text-blue-600'
                    }`}
                  >
                    [{error.level.toUpperCase()}]
                  </span>
                  <span className="text-gray-500">[{error.source}]</span>
                  <span className="text-gray-700 flex-1">{error.message}</span>
                  <span className="text-gray-400 text-xs">
                    {error.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                {error.metadata && Object.keys(error.metadata).length > 0 && (
                  <div className="mt-1 text-xs text-gray-500 pl-2 border-l-2 border-gray-200">
                    {Object.entries(error.metadata).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span>{' '}
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No errors match the current filters.</p>
        )}
      </div>
    </div>
  );
};
