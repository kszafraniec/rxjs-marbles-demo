import { TestScheduler } from 'rxjs/testing';
import { RunHelpers } from 'rxjs/internal/testing/TestScheduler';
import { concatMap, filter } from 'rxjs/operators';
import { retryExpTime } from './operators';
import { TestBed } from '@angular/core/testing';
import { StoreService } from './store.service';
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable';

export const getRxjsTestingScheduler: () => TestScheduler = (): TestScheduler => {
  return new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
};

describe('Rxjs marbles', () => {
  let storeService: StoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    storeService = TestBed.inject(StoreService);
  });

  describe('retryWhen', () => {
    it('should retry 3 times with growing time', () => {
      getRxjsTestingScheduler().run(
        ({ expectObservable, cold, expectSubscriptions }) => {
          const failingCall = cold('-a--#');
          const result = failingCall.pipe(retryExpTime(20));

          expectObservable(result).toBe('-a-- 20ms -a-- 40ms -a-- 80ms -a-- #');
          expectSubscriptions(failingCall.subscriptions).toBe([
            '                            ^---!',
            '                            ---- 20ms ^---!',
            '                            ---- 20ms ---- 40ms ^---!',
            '                            ---- 20ms ---- 40ms ---- 80ms ^---!',
          ]);
        }
      );
    });
  });

  describe('filter', () => {
    it('should filter values', () => {
      getRxjsTestingScheduler().run(({ expectObservable, cold }) => {
        const values = {
          a: 1,
          b: 20,
          c: 8,
          d: 33,
          e: 5,
        };

        const input = cold('           -a-b----c------d--------e--#', values);
        const result = input.pipe(filter((x) => x > 10));

        expectObservable(result).toBe('---b-----------d-----------#', values);
      });
    });
  });

  describe('concatMap', () => {
    it('cold', () => {
      getRxjsTestingScheduler().run(
        ({ cold, expectObservable, expectSubscriptions }: RunHelpers) => {
          const o1 = cold('                -x-x-x-|');
          const o2 = cold('                 abc-|');
          const expected = '               -abc-abc-abc-|';
          const expectedSubscriptions1 = '^------!';
          const expectedSubscriptions2 = [
            '                              -^---!',
            '                              -----^---!',
            '                              ---------^---!',
          ];

          const tested = o1.pipe(concatMap(() => o2));
          expectObservable(tested).toBe(expected);
          expectSubscriptions(o1.subscriptions).toBe(expectedSubscriptions1);
          expectSubscriptions(o2.subscriptions).toBe(expectedSubscriptions2);
        }
      );
    });

    it('hot', () => {
      getRxjsTestingScheduler().run(
        ({ cold, hot, expectObservable, expectSubscriptions }: RunHelpers) => {
          const o1 = cold('                           -x-x-x-|');
          const o2 = hot('                            -abc-|');
          const tested = o1.pipe(concatMap(() => o2));
          expectObservable(tested).toBe('             --bc---|');
          expectSubscriptions(o1.subscriptions).toBe('^------!');
          expectSubscriptions(o2.subscriptions).toBe([
            '                                         -^---!',
            '                                         -----(^!)',
            '                                         -----(^!)',
          ]);
        }
      );
    });
  });

  describe('StoreService', () => {
    it('should emit values', () => {
      getRxjsTestingScheduler().run(({ expectObservable }: RunHelpers) => {
        const tested = storeService.getValues$();

        expectObservable(tested).toBe('500ms (ab|)', {
          a: 1,
          b: 2,
        });
      });
    });

    it('should emit interval', () => {
      getRxjsTestingScheduler().run(({ expectObservable }: RunHelpers) => {
        const tested = storeService.getInterval$();

        expectObservable(tested).toBe(
          '200ms a 199ms b 199ms c 199ms d 199ms (e|)',
          {
            a: 0,
            b: 1,
            c: 2,
            d: 3,
            e: 4,
          }
        );
      });
    });

    it('should pass events', () => {
      getRxjsTestingScheduler().run(
        ({ expectObservable, cold }: RunHelpers) => {
          const values = {
            a: 1,
            b: 2,
            c: 3,
          };

          const input: ColdObservable<number> = cold(
            '--a--a--b--c--b--b--',
            values
          );

          input.subscribe((value) => storeService.emitEvent(value));

          expectObservable(storeService.getEvent$()).toBe(
            '--a-----b--c--b-----',
            values
          );
        }
      );
    });
  });
});
