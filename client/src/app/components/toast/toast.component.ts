import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService, UiToast } from '../../services/ui.service';
import { Subscription, timer } from 'rxjs';

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
    .toast-wrap { position: fixed; top: 16px; right: 16px; z-index: 9999; }
    .toast { padding: 10px 14px; border-radius: 6px; background:#333; color:#fff; font-size:14px; box-shadow:0 2px 8px rgba(0,0,0,.2); }
    .toast.error { background:#b00020; }
  `]
})
export class ToastComponent implements OnDestroy {
  current: UiToast | null = null;
  private sub?: Subscription;
  private killer?: Subscription;

  constructor(ui: UiService) {
    this.sub = ui.toasts$.subscribe(t => {
      this.current = t;
      this.killer?.unsubscribe();
      this.killer = timer(t.ttlMs ?? 3500).subscribe(() => this.current = null);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.killer?.unsubscribe();
  }
}
