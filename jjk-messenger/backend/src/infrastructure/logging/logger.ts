import debug from "debug";

const logger = {
  info: debug("app:info"),
  warn: debug("app:warn"),
  error: debug("app:error"),
};

function formatLogValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Error) {
    return JSON.stringify({ message: value.message, stack: value.stack });
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

logger.info.log = (...args: unknown[]): void => {
  process.stdout.write(`${args.map(formatLogValue).join(" ")}\n`);
};

logger.warn.log = (...args: unknown[]): void => {
  process.stderr.write(`${args.map(formatLogValue).join(" ")}\n`);
};

logger.error.log = (...args: unknown[]): void => {
  process.stderr.write(`${args.map(formatLogValue).join(" ")}\n`);
};

export default logger;
