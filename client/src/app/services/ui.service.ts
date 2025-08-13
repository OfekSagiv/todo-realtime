import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { APP_CONSTANTS } from '../constants/app.constants';

export type UiToast = { text: string; kind: 'info' | 'error'; ttlMs?: number };

@Injectable({ providedIn: 'root' })
export class UiService {
  private readonly _toasts$ = new Subject<UiToast>();
  readonly toasts$: Observable<UiToast> = this._toasts$.asObservable();

  info(text: string, ttlMs = APP_CONSTANTS.UI.TOAST_DEFAULT_DURATION_MS): void {
    this._toasts$.next({ text, kind: 'info', ttlMs });
  }

  error(text: string, ttlMs = APP_CONSTANTS.UI.TOAST_ERROR_DURATION_MS): void {
    this._toasts$.next({ text, kind: 'error', ttlMs });
  }
}
