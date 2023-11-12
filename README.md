## Intro

This is a simple retry wrapper (`invokeAndRetry`) over a function. The wrapper will retry the function if
  - error thrown by function
  - function result
  
is retryable.

Configuration supports:
  - retry attempt count
  - custom function to determine if retry is needed, based on function result and error if any
  - if backoff is needed (current it just supports fixed backoff of 1 second as for demo)

_This project is for assignment and demonstration purpose. Not for production use._

## Changes

### v2

* Add support of retryable function result

### v1

* Support retry if error thrown is retryable

## Example

```
const throwTrickyDice = async (): Promise<number> => {
  const randomNumber = Math.random();
  if (randomNumber < 0.3) {
    console.log('You dropped the dice. Please throw again');
    throw new Error();
  } else {
    return Math.ceil(randomNumber * 6);
  }
};

const retryConfig: RetryConfig<Result<number>> = {
  retryAttemptCount: 5,
  isRetryable: (result: Result<number>) => {
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
```

Result

```
> npx ts-node -T .\src\v2\example.ts
Your dice got 2. A bit small. Please throw again
You dropped the dice. Please throw again
Your dice got 3. A bit small. Please throw again
Your dice got 5 finally. No more retry
```
