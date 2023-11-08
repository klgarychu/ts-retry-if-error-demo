"# ts-dev-repository" 

## Intro

This is a simple retry wrapper over a function. The wrapper will retry when the function throws error which is retryable and the retry quota has not been used up. 

This project is for assignment and demonstration purpose. Not for production use.

## Example

* To wrap a function for retry

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

Scenerio in which the function successfully completes after retrying for 3 times.

```
> npx ts-node ./src/example.ts
Unlucky. You got some error.
Unlucky. You got some error.
Unlucky. You got some error.
You got Lucky
```