import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { fromEvent, Observable, Subject, map, share } from 'rxjs';
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

  readonly connected$:    Observable<boolean>;
  readonly disconnected$: Observable<void>;

  readonly taskCreated$:  Observable<TaskDto>;
  readonly taskUpdated$:  Observable<TaskDto>;
  readonly taskDeleted$:  Observable<{ id: string }>;
  readonly taskLocked$:   Observable<{ taskId: string; owner: string }>;
  readonly taskUnlocked$: Observable<{ taskId: string }>;

  private static readonly ACK_TIMEOUT_MS = 5000;

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
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  private emitWithAck<TAck extends { ok?: boolean; reason?: string }>(
    event: string,
    payload: any,
    timeoutMs = RealtimeService.ACK_TIMEOUT_MS
  ): Promise<TAck> {
    return new Promise<TAck>((resolve, reject) => {
      const to = setTimeout(() => reject(new Error(`Ack timeout for "${event}"`)), timeoutMs);
      this.socket.emit(event, payload, (ack: TAck) => {
        clearTimeout(to);
        if (typeof ack?.ok === 'boolean' && !ack.ok) {
          return reject(new Error(ack.reason || `Ack returned ok=false for "${event}"`));
        }
        resolve(ack);
      });
    });
  }

  acquireLock(taskId: string): Promise<LockAcquireAck> {
    return this.emitWithAck<LockAcquireAck>('lock:acquire', { taskId });
  }

  releaseLock(taskId: string, token?: string): Promise<LockReleaseAck> {
    return this.emitWithAck<LockReleaseAck>('lock:release', { taskId, token });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.socket?.disconnect();
  }
}
