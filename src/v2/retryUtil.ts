export type Result<T> = { ok: true; value: T } | { ok: false; thrownValue: unknown };

export interface RetryConfig<Result> {
  readonly retryAttemptCount: number;
  // eslint-disable-next-line no-unused-vars
  readonly isRetryable: (result: Result) => boolean;
  readonly backoff?: boolean;
}

const invoke = async <T>(fn: () => Promise<T>): Promise<Result<T>> => {
  try {
    const value: T = await fn();
    return { ok: true, value: value };
  } catch (error) {
    return { ok: false, thrownValue: error };
  }
};

const getResultValue = <T>(result: Result<T>): T => {
  if (result.ok) {
    return result.value;
  } else {
    throw result.thrownValue;
  }
};

const BACKOFF_TIME_IN_MS = 1000;

export const invokeAndRetry = async <T>(fn: () => Promise<T>, retryConfig: RetryConfig<Result<T>>): Promise<T> => {
  let invokedResult: Result<T>;
  invokedResult = await invoke(fn);
  for (let i = 0; i < retryConfig.retryAttemptCount; i++) {
    if (retryConfig.isRetryable(invokedResult)) {
      if (retryConfig.backoff) {
        await new Promise((resolve) => setTimeout(resolve, BACKOFF_TIME_IN_MS));
      }
      invokedResult = await invoke(fn);
    } else {
      break;
    }
  }
  return getResultValue(invokedResult);
};
