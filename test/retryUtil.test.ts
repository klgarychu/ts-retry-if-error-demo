import { RetryConfig, invokeAndRetryIfError } from '../src/retryUtil';

describe('invokeAndRetryIfError', () => {
  const SUCCESSFUL_RESULT: string = 'Function returns successfully';
  const RETRYABLE_ERROR = new Error('retryable error');
  const NON_RETRYABLE_ERROR = new Error('non-retryable error');
  const checkErrorIfRetryable = (error: unknown) => {
    return error instanceof Error && error.message === RETRYABLE_ERROR.message;
  };
  const TEST_RETRY_ATTEMPT_COUNT = 3;
  const TEST_RETRY_CONFIG: RetryConfig = {
    retryAttemptCount: TEST_RETRY_ATTEMPT_COUNT,
    isRetryable: checkErrorIfRetryable,
  };

  test('return without retry if no error', async () => {
    const fnMock = jest.fn();
    fnMock.mockReturnValue(SUCCESSFUL_RESULT);
    const result = await invokeAndRetryIfError(fnMock);
    expect(result).toBe(SUCCESSFUL_RESULT);
    expect(fnMock).toHaveBeenCalledTimes(1);
  });

  test('retry once and return for first time error by default retry config', async () => {
    const fnMock = jest.fn();
    fnMock.mockRejectedValueOnce(RETRYABLE_ERROR);
    fnMock.mockReturnValue(SUCCESSFUL_RESULT);
    const result = await invokeAndRetryIfError(fnMock);
    expect(result).toBe(SUCCESSFUL_RESULT);
    expect(fnMock).toHaveBeenCalledTimes(2);
  });

  test('retry once and return for first time error by custom retry config', async () => {
    const fnMock = jest.fn();
    fnMock.mockRejectedValueOnce(RETRYABLE_ERROR);
    fnMock.mockReturnValue(SUCCESSFUL_RESULT);
    const result = await invokeAndRetryIfError(fnMock, TEST_RETRY_CONFIG);
    expect(result).toBe(SUCCESSFUL_RESULT);
    expect(fnMock).toHaveBeenCalledTimes(2);
  });

  test('should not retry if isRetryable is set to always return false', async () => {
    const alwaysNotRetryable: Partial<RetryConfig> = { isRetryable: () => false };
    const fnMock = jest.fn();
    fnMock.mockRejectedValueOnce(RETRYABLE_ERROR);
    fnMock.mockReturnValue(SUCCESSFUL_RESULT);
    try {
      await invokeAndRetryIfError(fnMock, alwaysNotRetryable);
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
    const result = await invokeAndRetryIfError(fnMock, TEST_RETRY_CONFIG);
    expect(result).toBe(SUCCESSFUL_RESULT);
    expect(fnMock).toHaveBeenCalledTimes(3);
  });

  test('throw error after max retry attempt is exceeded', async () => {
    const fnMock = jest.fn();
    fnMock.mockRejectedValue(RETRYABLE_ERROR);
    try {
      await invokeAndRetryIfError(fnMock, TEST_RETRY_CONFIG);
    } catch (error) {
      expect(error).toBe(RETRYABLE_ERROR);
    }
    expect(fnMock).toHaveBeenCalledTimes(4);
  });

  test('throw error if non-retryable error for first time', async () => {
    const fnMock = jest.fn();
    fnMock.mockRejectedValueOnce(NON_RETRYABLE_ERROR);
    try {
      await invokeAndRetryIfError(fnMock, TEST_RETRY_CONFIG);
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
      await invokeAndRetryIfError(fnMock, TEST_RETRY_CONFIG);
    } catch (error) {
      expect(error).toBe(NON_RETRYABLE_ERROR);
    }
    expect(fnMock).toHaveBeenCalledTimes(2);
  });

  test('retry for a customized retry attempt count', async () => {
    const customRetryConfig: RetryConfig = { retryAttemptCount: 5, isRetryable: checkErrorIfRetryable };
    const fnMock = jest.fn();
    fnMock.mockRejectedValue(RETRYABLE_ERROR);
    try {
      await invokeAndRetryIfError(fnMock, customRetryConfig);
    } catch (error) {
      expect(error).toBe(RETRYABLE_ERROR);
    }
    expect(fnMock).toHaveBeenCalledTimes(6);
  });
});
