export interface RetryConfig {
  readonly retryAttemptCount: number;
  // eslint-disable-next-line no-unused-vars
  readonly isRetryable: (error: unknown) => boolean;
}

const DEFAULT_RETRY_ATTEMPT_COUNT = 3;
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retryAttemptCount: DEFAULT_RETRY_ATTEMPT_COUNT,
  isRetryable: () => true,
};

export async function invokeAndRetryIfError<T>(
  fn: () => Promise<T>,
  customizedRetryConfig?: Partial<RetryConfig>,
): Promise<T> {
  const retryConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...customizedRetryConfig };
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
