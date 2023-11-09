## Intro

This is a simple retry wrapper over a function. The wrapper will retry the function if
  - error thrown by function
  - function result
is retryable.

_This project is for assignment and demonstration purpose. Not for production use._

## Changes

### v2

* Add support of retryable function result

### v1

* Support retry if error thrown is retryable

## Example

```
import { invokeAndRetryIfError } from './retryUtil';

const randomThrowErrorFn = async function () {
  if (Math.random() > 0.1) {
    console.log('Unlucky. You got some error.');
    throw new Error();
  } else {
    return 'Lucky';
  }
};

invokeAndRetryIfError(randomThrowErrorFn).then((result) => {
    console.log(`You got ${result}`);
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
