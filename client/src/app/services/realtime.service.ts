import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { fromEvent, Observable, Subject, map, share, filter } from 'rxjs';
import { environment } from '../../environments/environment';
import { Task, TaskEventPayload} from '../types/task.types';
import { APP_CONSTANTS } from '../constants/app.constants';

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

function toTaskOrNull(raw: TaskEventPayload): Task | null {
  const id = raw?.id ?? raw?._id;
  if (!id) return null;
  return {
    id,
    title: raw?.title ?? '',
    completed: Boolean(raw?.completed),
    createdAt: raw?.createdAt ?? '',
    updatedAt: raw?.updatedAt ?? '',
  };
}

@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private socket: Socket;
  private destroyed$ = new Subject<void>();

  readonly connected$:    Observable<boolean>;
  readonly disconnected$: Observable<void>;

  readonly taskCreated$:  Observable<Task>;
  readonly taskUpdated$:  Observable<Task>;
  readonly taskDeleted$:  Observable<{ id: string }>;
  readonly taskLocked$:   Observable<{ taskId: string; owner: string }>;
  readonly taskUnlocked$: Observable<{ taskId: string }>;

  constructor() {
    this.socket = io(environment.wsUrl, {
      transports: APP_CONSTANTS.WEBSOCKET.TRANSPORTS as any,
      autoConnect: true,
      withCredentials: true,
    });

    this.connected$    = fromEvent(this.socket, 'connect').pipe(map(() => true), share());
    this.disconnected$ = fromEvent(this.socket, 'disconnect').pipe(share());

    this.taskCreated$ = fromEvent<TaskEventPayload>(this.socket, 'task:created').pipe(
        map(toTaskOrNull),
        filter((t): t is Task => t !== null),
        share()
    );

    this.taskUpdated$ = fromEvent<TaskEventPayload>(this.socket, 'task:updated').pipe(
        map(toTaskOrNull),
        filter((t): t is Task => t !== null),
        share()
    );

    this.taskDeleted$  = fromEvent<{ id: string }>(this.socket, 'task:deleted').pipe(share());
    this.taskLocked$   = fromEvent<{ taskId: string; owner: string }>(this.socket, 'task:locked').pipe(share());
    this.taskUnlocked$ = fromEvent<{ taskId: string }>(this.socket, 'task:unlocked').pipe(share());
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  private emitWithAck<TAck extends { ok?: boolean; reason?: string }>(
      event: string,
      payload: unknown,
      timeoutMs = APP_CONSTANTS.WEBSOCKET.ACK_TIMEOUT_MS
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

  toggleTaskStatus(taskId: string): Promise<{ ok: boolean; task?: Task; error?: string }> {
    return this.emitWithAck<{ ok: boolean; task?: Task; error?: string }>('task:toggle-status', { taskId });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.socket?.disconnect();
  }
}
