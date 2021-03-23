import { Injectable } from '@angular/core';
import { interval, Observable, of, Subject } from 'rxjs';
import { delay, distinctUntilChanged, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private event$: Subject<number> = new Subject<number>();

  constructor() {}

  getEvent$(): Observable<number> {
    return this.event$.asObservable().pipe(distinctUntilChanged());
  }

  emitEvent(value: number): void {
    this.event$.next(value);
  }

  getValues$(): Observable<number> {
    return of(1, 2).pipe(delay(500));
  }

  getInterval$(): Observable<number> {
    return interval(200).pipe(take(5));
  }
}
