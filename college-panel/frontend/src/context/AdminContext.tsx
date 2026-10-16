/**
 * AdminContext Re-export / Forwarder
 * Forwards to the independent, secure CollegeContext module.
 * Preserves 100% backward compatibility for imports from './context/AdminContext'.
 */

export * from './CollegeContext';
export { CollegeProvider as AdminProvider } from './CollegeContext';
