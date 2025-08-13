import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Task, CreateTaskDto, UpdateTaskDto } from '../types/task.types';
import { TaskHttpService } from '../services/task-http.service';
import { RealtimeService, LockAcquireAck } from '../services/realtime.service';
import { UiService } from '../services/ui.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TaskOperationError } from '../types/errors';

type LockInfo = { owner: string; token?: string };

@Injectable({ providedIn: 'root' })
export class TaskStore implements OnDestroy {
  private readonly _tasks$ = new BehaviorSubject<Task[]>([]);
  readonly tasks$ = this._tasks$.asObservable();

  private readonly locks = new Map<string, LockInfo>();
  private readonly destroyed$ = new Subject<void>();

  constructor(
    private http: TaskHttpService,
    private rt: RealtimeService,
    private ui: UiService
  ) {
    this.rt.taskCreated$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(task => this.upsertTask(task));

    this.rt.taskUpdated$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(task => this.upsertTask(task));

    this.rt.taskDeleted$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ id }) => this.removeLocal(id));

    this.rt.taskLocked$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ taskId, owner }) => this.setLock(taskId, { owner }));

    this.rt.taskUnlocked$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ taskId }) => this.clearLock(taskId));

    this.rt.disconnected$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.clearAllLocksLocal());
  }

  async loadAll(): Promise<void> {
    try {
      const list = await firstValueFrom(this.http.getAll());
      this._tasks$.next(list);
    } catch (error) {
      console.error('[TaskStore] Failed to load tasks:', error);
    }
  }

  async create(dto: CreateTaskDto): Promise<Task | null> {
    try {
      const created = await firstValueFrom(this.http.create(dto));
      this.upsertTask(created);
      this.ui.info('Task created successfully');
      return created;
    } catch (error) {
      const taskError = new TaskOperationError('create', null, error);
      console.error('[TaskStore]', taskError);
      this.ui.error('Failed to create task. Please try again.');
      return null;
    }
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task | null> {
    try {
      const token = this.locks.get(id)?.token;
      const updated = await firstValueFrom(this.http.update(id, dto, token));
      this.upsertTask(updated);
      this.ui.info('Task updated successfully');
      return updated;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        switch (error.status) {
          case 423:
            this.ui.error('Task is locked by another editor');
            return null;
          case 404:
            this.ui.error('Task not found');
            this.removeLocal(id);
            return null;
          case 422:
            this.ui.error('Invalid task data provided');
            return null;
        }
      }

      const taskError = new TaskOperationError('update', id, error);
      console.error('[TaskStore]', taskError);
      this.ui.error('Failed to update task. Please try again.');
      return null;
    }
  }

  async remove(id: string): Promise<{ id: string } | null> {
    try {
      const token = this.locks.get(id)?.token;
      const res = await firstValueFrom(this.http.delete(id, token));
      this.removeLocal(id);
      return res;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 423) {
        this.ui.error('Task is locked by another editor');
        return null;
      }
      console.error(`[TaskStore] Failed to delete task ${id}:`, error);
      return null;
    }
  }

  async acquireLock(taskId: string): Promise<LockAcquireAck | null> {
    try {
      const ack = await this.rt.acquireLock(taskId);
      if (ack?.ok && ack.lock) {
        this.setLock(taskId, { owner: ack.lock.owner, token: ack.lock.token });
      }
      return ack;
    } catch (error) {
      console.error(`[TaskStore] Failed to acquire lock for task ${taskId}:`, error);
      return null;
    }
  }

  async releaseLock(taskId: string): Promise<void> {
    try {
      const token = this.locks.get(taskId)?.token;
      const res = await this.rt.releaseLock(taskId, token);
      const ok =
        typeof res === 'object' &&
        res !== null &&
        (('ok' in (res as any) && Boolean((res as any).ok)) ||
          ('status' in (res as any) && [200, 204, 404, 409].includes(Number((res as any).status))));
      if (ok) {
        this.clearLock(taskId);
      } else {
        console.error(`[TaskStore] Server refused to release lock for task ${taskId}; keeping local lock.`);
      }
    } catch (error) {
      console.error(`[TaskStore] Failed to release lock for task ${taskId}; keeping local lock.`, error);
    }
  }

  isLocked(taskId: string): boolean {
    return this.locks.has(taskId);
  }

  isLockedByMe(taskId: string): boolean {
    const lock = this.locks.get(taskId);
    return !!lock && lock.owner === this.mySocketId();
  }

  mySocketId(): string | undefined {
    return this.rt.getSocketId();
  }

  clearAllLocksLocal(): void {
    this.locks.clear();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  private upsertTask(task: Task): void {
    const list = this._tasks$.value.slice();
    const idx = list.findIndex(t => t.id === task.id);
    if (idx === -1) list.unshift(task);
    else list[idx] = task;
    this._tasks$.next(list);
  }

  private removeLocal(id: string): void {
    this._tasks$.next(this._tasks$.value.filter(t => t.id !== id));
    this.clearLock(id);
  }

  private setLock(taskId: string, lock: LockInfo): void {
    this.locks.set(taskId, lock);
  }

  private clearLock(taskId: string): void {
    this.locks.delete(taskId);
  }
}
