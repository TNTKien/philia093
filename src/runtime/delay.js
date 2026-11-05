export function createAbortError(signal) {
  const reason = signal?.reason;
  if (reason instanceof Error && reason.name === "AbortError") return reason;

  const error = new Error(reason instanceof Error ? reason.message : "The operation was aborted.");
  error.name = "AbortError";
  return error;
}

export function throwIfAborted(signal) {
  if (signal?.aborted) throw createAbortError(signal);
}

export function delay(milliseconds, signal) {
  throwIfAborted(signal);
  const duration = Math.max(0, Number(milliseconds) || 0);
  if (duration === 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };

    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(createAbortError(signal));
    };

    const timer = setTimeout(finish, duration);
    signal?.addEventListener("abort", abort, { once: true });
  });
}
