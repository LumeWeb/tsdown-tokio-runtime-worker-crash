import React from "react";
import { useRouteError } from "react-router";

interface RouteErrorProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export function RouteErrorBoundary({ error, resetErrorBoundary }: RouteErrorProps = {}) {
  const routeError = useRouteError();
  const displayError = error || routeError;
  
  // Handle specific route resolution errors
  const errorMessage = displayError instanceof Error 
    ? displayError.message
    : typeof displayError === 'string' 
      ? displayError
      : 'Failed to load route component';

  const isResolutionError = errorMessage.includes('component') || 
                           errorMessage.includes('export') ||
                           errorMessage.includes('plugin');
  
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">
        {isResolutionError ? 'Failed to resolve route component' : 'Failed to load component'}
      </h2>
      <p className="text-red-600 mb-4">{errorMessage}</p>
      {resetErrorBoundary && (
        <button 
          className="px-4 py-2 bg-red-100 rounded hover:bg-red-200"
          onClick={resetErrorBoundary}
        >
          Retry
        </button>
      )}
    </div>
  );
}
