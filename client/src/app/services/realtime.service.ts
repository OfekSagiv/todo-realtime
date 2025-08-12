import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { fromEvent, Observable, Subject, map, share, takeUntil } from 'rxjs';
import { environment } from '../../environments/environment';

export type TaskDto = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export interface LockAcquireAck {
  ok: boolean;
  lock?: { taskId: string; owner: string; token: string };
  reason?: string;
  owner?: string;
}

export interface LockReleaseAck {
  ok: boolean;
  message?: string;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private socket: Socket;
  private destroyed$ = new Subject<void>();

  readonly connected$: Observable<boolean>;
  readonly disconnected$: Observable<void>;

  readonly taskCreated$:  Observable<TaskDto>;
  readonly taskUpdated$:  Observable<TaskDto>;
  readonly taskDeleted$:  Observable<{ id: string }>;
  readonly taskLocked$:   Observable<{ taskId: string; owner: string }>;
  readonly taskUnlocked$: Observable<{ taskId: string }>;

  constructor() {
    this.socket = io(environment.wsUrl, {
      transports: ['websocket'],
      autoConnect: true,
      withCredentials: true,
    });

    this.connected$    = fromEvent(this.socket, 'connect').pipe(map(() => true), share());
    this.disconnected$ = fromEvent(this.socket, 'disconnect').pipe(share());

    this.taskCreated$  = fromEvent<TaskDto>(this.socket, 'task:created').pipe(share());
    this.taskUpdated$  = fromEvent<TaskDto>(this.socket, 'task:updated').pipe(share());
    this.taskDeleted$  = fromEvent<{ id: string }>(this.socket, 'task:deleted').pipe(share());
    this.taskLocked$   = fromEvent<{ taskId: string; owner: string }>(this.socket, 'task:locked').pipe(share());
    this.taskUnlocked$ = fromEvent<{ taskId: string }>(this.socket, 'task:unlocked').pipe(share());

    this.connected$.pipe(takeUntil(this.destroyed$))
      .subscribe(() => console.log('[WS] connected', this.socket.id));
    this.disconnected$.pipe(takeUntil(this.destroyed$))
      .subscribe(() => console.log('[WS] disconnected'));
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  acquireLock(taskId: string): Promise<LockAcquireAck> {
    return new Promise((resolve) => {
      this.socket.emit('lock:acquire', { taskId }, (ack: LockAcquireAck) => resolve(ack));
    });
  }

  releaseLock(taskId: string, token?: string): Promise<LockReleaseAck> {
    return new Promise((resolve) => {
      this.socket.emit('lock:release', { taskId, token }, (ack: LockReleaseAck) => resolve(ack));
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.socket?.disconnect();
  }
}
