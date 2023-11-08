export interface RetryConfig {
  readonly retryAttemptCount: number;
  readonly isRetryable: (error: unknown) => boolean;
}

const DEFAULT_RETRY_ATTEMPT_COUNT = 3;
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retryAttemptCount: DEFAULT_RETRY_ATTEMPT_COUNT,
  isRetryable: (error: unknown) => true,
};

export async function invokeAndRetryIfError<T>(
  fn: () => Promise<T>,
  customizedRetryConfig?: Partial<RetryConfig>,
): Promise<T> {
  const retryConfig: RetryConfig = Object.assign({}, DEFAULT_RETRY_CONFIG, customizedRetryConfig);
  try {
    return await fn();
  } catch (error: unknown) {
    if (retryConfig.retryAttemptCount <= 0 || !retryConfig.isRetryable(error)) {
      throw error;
    }

    return invokeAndRetryIfError(fn, {
      retryAttemptCount: retryConfig.retryAttemptCount - 1,
      isRetryable: retryConfig.isRetryable,
    });
  }
}
