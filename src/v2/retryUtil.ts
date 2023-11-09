export type Result<T, E = unknown> = { ok: true; value: T } | { ok: false; thrownValue: E };

export interface RetryConfig<Result> {
  readonly retryAttemptCount: number;
  // eslint-disable-next-line no-unused-vars
  readonly isRetryable: (result: Result) => boolean;
}

const invoke = async <T>(fn: () => Promise<T>): Promise<Result<T, unknown>> => {
  try {
    const value: T = await fn();
    return { ok: true, value: value };
  } catch (error) {
    return { ok: false, thrownValue: error };
  }
};

const getResultValue = <T>(result: Result<T, unknown>): T => {
  if (result.ok) {
    return result.value;
  } else {
    throw result.thrownValue;
  }
};

export const invokeAndRetry = async <T>(
  fn: () => Promise<T>,
  retryConfig: RetryConfig<Result<T, unknown>>,
): Promise<T> => {
  let invokedResult: Result<T, unknown>;
  invokedResult = await invoke(fn);
  for (let i = 0; i < retryConfig.retryAttemptCount; i++) {
    if (retryConfig.isRetryable(invokedResult)) {
      invokedResult = await invoke(fn);
    } else {
      break;
    }
  }
  return getResultValue(invokedResult);
};
