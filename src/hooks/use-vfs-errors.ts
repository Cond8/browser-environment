// src/hooks/use-vfs-errors.ts
import type { ErrorLevel, ErrorSource, VfsError } from '@/features/vfs/store/vfs-store';
import { useVfsStore } from '@/features/vfs/store/vfs-store';
import { useCallback, useMemo, useState } from 'react';

// Define the hook return type for better type safety
interface UseVfsErrorsReturn {
  // Error access
  errors: VfsError[];
  lastError: VfsError | null;
  hasErrors: boolean;

  // Filtering
  errorsBySource: (source: ErrorSource) => VfsError[];
  errorsByLevel: (level: ErrorLevel) => VfsError[];
  filteredErrors: VfsError[];

  // Filter state
  filterSource: ErrorSource | null;
  filterLevel: ErrorLevel | null;
  setFilterSource: (source: ErrorSource | null) => void;
  setFilterLevel: (level: ErrorLevel | null) => void;

  // Actions
  clearErrors: () => void;
  clearFilters: () => void;

  // Formatting for UI
  getFormattedErrors: () => string;
  getErrorsAsJSON: () => Record<string, any>[];
}

/**
 * Custom hook for accessing and managing VFS errors
 * Provides filtering, formatting and management utilities for VFS errors
 */
export function useVfsErrors(): UseVfsErrorsReturn {
  // Access error state from the store
  const allErrors = useVfsStore(state => state.getAllErrors());
  const lastError = useVfsStore(state => state.getLastError());
  const clearErrors = useVfsStore(state => state.clearErrors);
  const getFormattedErrors = useVfsStore(state => state.getErrorsFormatted);
  const getErrorsAsJSON = useVfsStore(state => state.getErrorsAsJSON);

  // Local filter state
  const [filterSource, setFilterSource] = useState<ErrorSource | null>(null);
  const [filterLevel, setFilterLevel] = useState<ErrorLevel | null>(null);

  // Filtering functions
  const errorsBySource = useCallback((source: ErrorSource) => {
    return useVfsStore.getState().filterErrorsBySource(source);
  }, []);

  const errorsByLevel = useCallback((level: ErrorLevel) => {
    return useVfsStore.getState().filterErrorsByLevel(level);
  }, []);

  // Apply filters to get filtered errors
  const filteredErrors = useMemo(() => {
    let result = [...allErrors];

    if (filterSource) {
      result = result.filter(error => error.source === filterSource);
    }

    if (filterLevel) {
      result = result.filter(error => error.level === filterLevel);
    }

    return result;
  }, [allErrors, filterSource, filterLevel]);

  // Reset filters
  const clearFilters = useCallback(() => {
    setFilterSource(null);
    setFilterLevel(null);
  }, []);

  return {
    errors: allErrors,
    lastError,
    hasErrors: allErrors.length > 0,

    errorsBySource,
    errorsByLevel,
    filteredErrors,

    filterSource,
    filterLevel,
    setFilterSource,
    setFilterLevel,

    clearErrors,
    clearFilters,

    getFormattedErrors,
    getErrorsAsJSON,
  };
}
