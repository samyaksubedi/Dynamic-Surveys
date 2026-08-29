type LogDetails = Record<string, unknown>;

const write = (
  level: "info" | "warn" | "error",
  message: string,
  details?: LogDetails,
) => {
  const record = { level, time: new Date().toISOString(), message, ...details };
  const output = JSON.stringify(record);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.info(output);
};

export const logger = {
  info: (message: string, details?: LogDetails) =>
    write("info", message, details),
  warn: (message: string, details?: LogDetails) =>
    write("warn", message, details),
  error: (message: string, details?: LogDetails) =>
    write("error", message, details),
};
