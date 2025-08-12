import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { fromEvent, Observable, Subject, map, share, takeUntil } from 'rxjs';
import { environment } from '../../environments/environment';

type TaskDto = { id: string; title: string; completed: boolean; createdAt: string; updatedAt: string };

@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private socket: Socket;
  private destroyed$ = new Subject<void>();

  readonly connected$: Observable<boolean>;
  readonly disconnected$: Observable<void>;

  readonly taskCreated$: Observable<TaskDto>;
  readonly taskUpdated$: Observable<TaskDto>;
  readonly taskDeleted$: Observable<{ id: string }>;
  readonly taskLocked$:  Observable<{ taskId: string; owner: string }>;
  readonly taskUnlocked$:Observable<{ taskId: string }>;

  constructor() {
    this.socket = io(environment.wsUrl, {
      transports: ['websocket'],
      autoConnect: true,
      withCredentials: true,
    });

    this.connected$   = fromEvent(this.socket, 'connect').pipe(map(() => true), share());
    this.disconnected$= fromEvent(this.socket, 'disconnect').pipe(share());

    this.taskCreated$  = fromEvent(this.socket, 'task:created') .pipe(share()) as Observable<TaskDto>;
    this.taskUpdated$  = fromEvent(this.socket, 'task:updated') .pipe(share()) as Observable<TaskDto>;
    this.taskDeleted$  = fromEvent(this.socket, 'task:deleted') .pipe(share()) as Observable<{ id: string }>;
    this.taskLocked$   = fromEvent(this.socket, 'task:locked')  .pipe(share()) as Observable<{ taskId: string; owner: string }>;
    this.taskUnlocked$ = fromEvent(this.socket, 'task:unlocked').pipe(share()) as Observable<{ taskId: string }>;

    this.connected$.pipe(takeUntil(this.destroyed$)).subscribe(() => console.log('[WS] connected', this.socket.id));
    this.disconnected$.pipe(takeUntil(this.destroyed$)).subscribe(() => console.log('[WS] disconnected'));
  }

  acquireLock(taskId: string): Promise<{ ok: boolean; lock?: { taskId: string; owner: string; token: string }; reason?: string; owner?: string }> {
    return new Promise((resolve) => {
      this.socket.emit('lock:acquire', { taskId }, (ack: any) => resolve(ack));
    });
  }

  releaseLock(taskId: string, token?: string): Promise<{ ok: boolean; message?: string; reason?: string }> {
    return new Promise((resolve) => {
      this.socket.emit('lock:release', { taskId, token }, (ack: any) => resolve(ack));
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.socket?.disconnect();
  }
}
