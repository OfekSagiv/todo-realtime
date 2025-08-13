import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService, UiToast } from '../../services/ui.service';
import { Subscription, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { APP_CONSTANTS } from '../../constants/app.constants';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrap" *ngIf="current as t">
     <div class="toast" [class.error]="t.kind==='error'">{{ t.text }}</div>
    </div>
  `,
  styles: [`
    .toast-wrap {
      position: fixed;
      top: var(--spacing-lg, 16px);
      right: var(--spacing-lg, 16px);
      z-index: 9999;
    }
    .toast {
      padding: var(--spacing-sm, 10px) var(--spacing-md, 14px);
      border-radius: var(--radius-sm, 6px);
      background: #333;
      color: #fff;
      font-size: var(--text-sm, 14px);
      box-shadow: 0 2px 8px rgba(0,0,0,.2);
    }
    .toast.error { background: #b00020; }
  `]
})
export class ToastComponent {
  current: UiToast | null = null;
  private killer?: Subscription;
  private readonly destroyRef = inject(DestroyRef);

  constructor(ui: UiService) {
    ui.toasts$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(t => {
        this.current = t;
        this.killer?.unsubscribe();
        const duration = t.kind === 'error'
          ? APP_CONSTANTS.UI.TOAST_ERROR_DURATION_MS
          : (t.ttlMs ?? APP_CONSTANTS.UI.TOAST_DEFAULT_DURATION_MS);
        this.killer = timer(duration).subscribe(() => this.current = null);
      });
  }
}
