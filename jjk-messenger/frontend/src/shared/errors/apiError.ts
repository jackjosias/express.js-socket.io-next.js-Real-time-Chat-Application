type ApiErrorPayload = {
  data?: {
    message?: unknown;
  };
};

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return fallbackMessage;
  }

  const message = (error as ApiErrorPayload).data?.message;

  return typeof message === "string" && message.trim()
    ? message
    : fallbackMessage;
}
