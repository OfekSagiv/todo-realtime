import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export type UiToast = { text: string; kind: 'info' | 'error'; ttlMs?: number };

@Injectable({ providedIn: 'root' })
export class UiService {
  private readonly _toasts$ = new Subject<UiToast>();
  readonly toasts$: Observable<UiToast> = this._toasts$.asObservable();

  info(text: string, ttlMs = 3500): void {
    this._toasts$.next({ text, kind: 'info', ttlMs });
  }

  error(text: string, ttlMs = 4500): void {
    this._toasts$.next({ text, kind: 'error', ttlMs });
  }
}
