// Ensure Reanimated logger config exists before any Reanimated code runs.
// This prevents errors like: Cannot read properties of undefined (reading 'level')
// which occur if global.__reanimatedLoggerConfig is unset when logger.warn/error is called.

// Use ambient any to avoid type coupling with reanimated internals.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const globalThis: any;

if (!globalThis.__reanimatedLoggerConfig) {
  globalThis.__reanimatedLoggerConfig = {
    // The logger API expects a function accepting { level, message }
    logFunction: (data: { level: number; message: string }) => {
      // 1 = warn, 2 = error (per ReanimatedLogLevel)
      if (data?.level === 1) console.warn(data.message);
      else console.error(data?.message ?? '');
    },
    // Default minimum level: show warnings and errors
    level: 1,
    // Keep strict mode enabled to surface issues in dev
    strict: true,
  };
}

export { };

