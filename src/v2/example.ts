import { Result, RetryConfig, invokeAndRetry } from './retryUtil';

const throwTrickyDice = async (): Promise<number> => {
  const randomNumber = Math.random();
  if (randomNumber < 0.3) {
    console.log('You dropped the dice. Please throw again');
    throw new Error();
  } else {
    return Math.ceil(randomNumber * 6);
  }
};

const retryConfig: RetryConfig<Result<number, unknown>> = {
  retryAttemptCount: 5,
  isRetryable: (result: Result<number, unknown>) => {
    if (result.ok) {
      if (result.value < 5) {
        console.log(`Your dice got ${result.value}. A bit small. Please throw again`);
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  },
};

invokeAndRetry(throwTrickyDice, retryConfig)
  .then((result) => {
    console.log(`Your dice got ${result} finally. No more retry`);
  })
  .catch(() => {
    console.log('Your retry quota is used up!');
  });
