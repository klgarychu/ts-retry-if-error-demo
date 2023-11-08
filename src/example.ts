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
