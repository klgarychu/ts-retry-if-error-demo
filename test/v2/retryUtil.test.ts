import { Result, RetryConfig, invokeAndRetry } from '../../src/v2/retryUtil';

describe('invokeAndRetry', () => {
  const SUCCESSFUL_RESULT: string = 'Function returns successfully';
  const RETRYABLE_RESULT: string = 'Please retry';
  const RETRYABLE_ERROR = new Error('retryable error');
  const NON_RETRYABLE_ERROR = new Error('non-retryable error');
  const checkErrorIfRetryable = (error: unknown) => {
    return error instanceof Error && error.message === RETRYABLE_ERROR.message;
  };
  const checkValueIfRetryable = (value: string) => value === RETRYABLE_RESULT;
  const TEST_RETRY_ATTEMPT_COUNT = 3;
  const TEST_ISRETRYABLE = (result: Result<string>) =>
    result.ok ? checkValueIfRetryable(result.value) : checkErrorIfRetryable(result.thrownValue);
  const TEST_RETRY_CONFIG: RetryConfig<Result<string>> = {
    retryAttemptCount: TEST_RETRY_ATTEMPT_COUNT,
    isRetryable: TEST_ISRETRYABLE,
  };
  const advanceTimeInMs = async (ms: number) => {
    jest.advanceTimersByTime(ms);
    return new Promise((resolve) => jest.requireActual('timers').setImmediate(resolve));
  };
  const TEST_BACKOFF_TIME_IN_MS = 1000;

  test('return without retry if no error and not retryable result', async () => {
    const fnMock = jest.fn();
    fnMock.mockReturnValue(SUCCESSFUL_RESULT);
    const result = await invokeAndRetry(fnMock, TEST_RETRY_CONFIG);
    expect(result).toBe(SUCCESSFUL_RESULT);
    expect(fnMock).toHaveBeenCalledTimes(1);
  });

  test('return without retry if no error and not retryable result, and with backoff', async () => {
    const fnMock = jest.fn();
    fnMock.mockReturnValue(SUCCESSFUL_RESULT);
    const result = await invokeAndRetry(fnMock, { ...TEST_RETRY_CONFIG, backoff: true });
    expect(result).toBe(SUCCESSFUL_RESULT);
    expect(fnMock).toHaveBeenCalledTimes(1);
  });

  test('retry once and return for first time error by default retry config', async () => {
    const fnMock = jest.fn();
    fnMock.mockRejectedValueOnce(RETRYABLE_ERROR);
    fnMock.mockReturnValue(SUCCESSFUL_RESULT);
    const result = await invokeAndRetry(fnMock, TEST_RETRY_CONFIG);
    expect(result).toBe(SUCCESSFUL_RESULT);
    expect(fnMock).toHaveBeenCalledTimes(2);
  });

  test('retry once and return for first time error by default retry config, and with backoff', async () => {
    jest.useFakeTimers();
    const fnMock = jest.fn();
    fnMock.mockRejectedValueOnce(RETRYABLE_ERROR);
    fnMock.mockReturnValue(SUCCESSFUL_RESULT);
    const invokeFnPromise = invokeAndRetry(fnMock, { ...TEST_RETRY_CONFIG, backoff: true });
    await advanceTimeInMs(TEST_BACKOFF_TIME_IN_MS);
    expect(fnMock).toHaveBeenCalledTimes(1);
    await advanceTimeInMs(TEST_BACKOFF_TIME_IN_MS);
    const result = await invokeFnPromise;
    expect(result).toBe(SUCCESSFUL_RESULT);
    expect(fnMock).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  test('retry once and return if first time result is retryable', async () => {
    const fnMock = jest.fn();
    fnMock.mockReturnValueOnce(RETRYABLE_RESULT);
    fnMock.mockReturnValue(SUCCESSFUL_RESULT);
    const result = await invokeAndRetry(fnMock, TEST_RETRY_CONFIG);
    expect(result).toBe(SUCCESSFUL_RESULT);
    expect(fnMock).toHaveBeenCalledTimes(2);
  });

  test('retry once and return for first time error by custom retry config', async () => {
    const fnMock = jest.fn();
    fnMock.mockRejectedValueOnce(RETRYABLE_ERROR);
    fnMock.mockReturnValue(SUCCESSFUL_RESULT);
    const result = await invokeAndRetry(fnMock, TEST_RETRY_CONFIG);
    expect(result).toBe(SUCCESSFUL_RESULT);
    expect(fnMock).toHaveBeenCalledTimes(2);
  });

  test('should not retry if isRetryable is set to always return false', async () => {
    const alwaysNotRetryable: RetryConfig<Result<string>> = {
      retryAttemptCount: TEST_RETRY_ATTEMPT_COUNT,
      isRetryable: () => false,
    };
    const fnMock = jest.fn();
    fnMock.mockRejectedValueOnce(RETRYABLE_ERROR);
    fnMock.mockReturnValue(SUCCESSFUL_RESULT);
    try {
      await invokeAndRetry(fnMock, alwaysNotRetryable);
    } catch (error) {
      expect(error).toBe(RETRYABLE_ERROR);
    }
    expect(fnMock).toHaveBeenCalledTimes(1);
  });

  test('retry twice and return if error for first two times', async () => {
    const fnMock = jest.fn();
    fnMock.mockRejectedValueOnce(RETRYABLE_ERROR);
    fnMock.mockRejectedValueOnce(RETRYABLE_ERROR);
    fnMock.mockReturnValue(SUCCESSFUL_RESULT);
    const result = await invokeAndRetry(fnMock, TEST_RETRY_CONFIG);
    expect(result).toBe(SUCCESSFUL_RESULT);
    expect(fnMock).toHaveBeenCalledTimes(3);
  });

  test('throw error after max retry attempt is exceeded for error', async () => {
    const fnMock = jest.fn();
    fnMock.mockRejectedValue(RETRYABLE_ERROR);
    try {
      await invokeAndRetry(fnMock, TEST_RETRY_CONFIG);
    } catch (error) {
      expect(error).toBe(RETRYABLE_ERROR);
    }
    expect(fnMock).toHaveBeenCalledTimes(4);
  });

  test('throw error after max retry attempt is exceeded for retryable result', async () => {
    const fnMock = jest.fn();
    fnMock.mockResolvedValue(RETRYABLE_RESULT);
    const result = await invokeAndRetry(fnMock, TEST_RETRY_CONFIG);
    expect(result).toBe(RETRYABLE_RESULT);
    expect(fnMock).toHaveBeenCalledTimes(4);
  });

  test('throw error if non-retryable error for first time', async () => {
    const fnMock = jest.fn();
    fnMock.mockRejectedValueOnce(NON_RETRYABLE_ERROR);
    try {
      await invokeAndRetry(fnMock, TEST_RETRY_CONFIG);
    } catch (error) {
      expect(error).toBe(NON_RETRYABLE_ERROR);
    }
    expect(fnMock).toHaveBeenCalledTimes(1);
  });

  test('throw error if non-retryable error during second time', async () => {
    const fnMock = jest.fn();
    fnMock.mockRejectedValueOnce(RETRYABLE_ERROR);
    fnMock.mockRejectedValue(NON_RETRYABLE_ERROR);
    try {
      await invokeAndRetry(fnMock, TEST_RETRY_CONFIG);
    } catch (error) {
      expect(error).toBe(NON_RETRYABLE_ERROR);
    }
    expect(fnMock).toHaveBeenCalledTimes(2);
  });

  test('retry for a customized retry attempt count', async () => {
    const customRetryConfig: RetryConfig<Result<string>> = {
      retryAttemptCount: 5,
      isRetryable: TEST_ISRETRYABLE,
    };
    const fnMock = jest.fn();
    fnMock.mockRejectedValue(RETRYABLE_ERROR);
    try {
      await invokeAndRetry(fnMock, customRetryConfig);
    } catch (error) {
      expect(error).toBe(RETRYABLE_ERROR);
    }
    expect(fnMock).toHaveBeenCalledTimes(6);
  });
});
