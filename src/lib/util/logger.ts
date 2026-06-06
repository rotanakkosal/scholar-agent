/**
 * Tiny logger that writes to stderr, keeping stdout clean for CLI JSON output.
 * Set DEBUG=1 to see debug lines.
 */
export const logger = {
  info: (...args: unknown[]) => console.error("[info] ", ...args),
  warn: (...args: unknown[]) => console.error("[warn] ", ...args),
  error: (...args: unknown[]) => console.error("[error]", ...args),
  debug: (...args: unknown[]) => {
    if (process.env.DEBUG) console.error("[debug]", ...args);
  },
};
