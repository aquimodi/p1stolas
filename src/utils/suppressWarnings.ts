// This helper suppresses specific React warnings that we can't fix directly
// (like those coming from third-party libraries)

/**
 * Suppresses React Beautiful DnD defaultProps warnings
 * These warnings appear because the library uses defaultProps with memo components,
 * which is being deprecated in React
 */
export const suppressDndWarnings = () => {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Filter DnD warnings
    if (typeof args[0] === 'string') {
      // 1. Suppress defaultProps warning for memo components
      if (args[0].includes('Support for defaultProps will be removed from memo components')) {
        return;
      }
      
      // 2. Suppress invariant failure warnings from react-beautiful-dnd
      if (args[0].includes('Invariant failed: Cannot find droppable entry')) {
        return;
      }
      
      // 3. Suppress findDOMNode is deprecated warnings
      if (args[0].includes('Warning: findDOMNode is deprecated in StrictMode')) {
        return;
      }
    }
    
    // Otherwise, pass through to the original console.error
    originalConsoleError.apply(console, args);
  };

  return () => {
    // Return a cleanup function to restore the original console.error
    console.error = originalConsoleError;
  };
};