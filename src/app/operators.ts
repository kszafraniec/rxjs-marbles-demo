import { MonoTypeOperatorFunction, throwError, timer } from 'rxjs';
import { finalize, mergeMap, retryWhen } from 'rxjs/operators';

export function retryExpTime<T>(baseTime: number): MonoTypeOperatorFunction<T> {
  return retryWhen<T>((attempts) =>
    attempts.pipe(
      mergeMap((error, retryAttempt) => {
        if (retryAttempt >= 3) {
          return throwError(error);
        }

        return timer(baseTime * Math.pow(2, retryAttempt));
      }),
      finalize(() => console.log('We are done!'))
    )
  );
}
