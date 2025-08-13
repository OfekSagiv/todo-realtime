import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Task, CreateTaskDto, UpdateTaskDto, LockInfo } from '../types/task.types';
import { TaskHttpService } from '../services/task-http.service';
import { RealtimeService, LockAcquireAck } from '../services/realtime.service';
import { UiService } from '../services/ui.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TaskOperationError } from '../types/errors';
import { APP_CONSTANTS } from '../constants/app.constants';
import { MESSAGES } from '../constants/messages.constants';

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
      .subscribe(() => {
        this.clearAllLocksLocal();
        this.ui.info(MESSAGES.ERROR.CONNECTION_LOST);
      });
  }

  async loadAll(): Promise<void> {
    try {
      const list = await firstValueFrom(this.http.getAll());
      this._tasks$.next(list);
    } catch (error) {
      const taskError = new TaskOperationError('load', null, error);
      console.error('[TaskStore]', taskError);
      this.ui.error(MESSAGES.ERROR.TASK_LOAD_FAILED);
    }
  }

  async create(dto: CreateTaskDto): Promise<Task | null> {
    try {
      const created = await firstValueFrom(this.http.create(dto));
      this.upsertTask(created);
      this.ui.info(MESSAGES.SUCCESS.TASK_CREATED);
      return created;
    } catch (error) {
      const taskError = new TaskOperationError('create', null, error);
      console.error('[TaskStore]', taskError);
      this.ui.error(MESSAGES.ERROR.TASK_CREATE_FAILED);
      return null;
    }
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task | null> {
    try {
      const token = this.locks.get(id)?.token;
      const updated = await firstValueFrom(this.http.update(id, dto, token));
      this.upsertTask(updated);
      this.ui.info(MESSAGES.SUCCESS.TASK_UPDATED);
      return updated;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        switch (error.status) {
          case APP_CONSTANTS.HTTP_STATUS.LOCKED:
            this.ui.error(MESSAGES.ERROR.TASK_LOCKED_BY_OTHER);
            return null;
          case APP_CONSTANTS.HTTP_STATUS.NOT_FOUND:
            this.ui.error(MESSAGES.ERROR.TASK_NOT_FOUND);
            this.removeLocal(id);
            return null;
          case APP_CONSTANTS.HTTP_STATUS.UNPROCESSABLE_ENTITY:
            this.ui.error(MESSAGES.ERROR.TASK_INVALID_DATA);
            return null;
        }
      }

      const taskError = new TaskOperationError('update', id, error);
      console.error('[TaskStore]', taskError);
      this.ui.error(MESSAGES.ERROR.TASK_UPDATE_FAILED);
      return null;
    }
  }

  async remove(id: string): Promise<{ id: string } | null> {
    try {
      const token = this.locks.get(id)?.token;
      const res = await firstValueFrom(this.http.delete(id, token));
      this.removeLocal(id);
      this.ui.info(MESSAGES.SUCCESS.TASK_DELETED);
      return res;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === APP_CONSTANTS.HTTP_STATUS.LOCKED) {
        this.ui.error(MESSAGES.ERROR.TASK_LOCKED_BY_OTHER);
        return null;
      }
      const taskError = new TaskOperationError('delete', id, error);
      console.error('[TaskStore]', taskError);
      this.ui.error(MESSAGES.ERROR.TASK_DELETE_FAILED);
      return null;
    }
  }

  async acquireLock(taskId: string): Promise<LockAcquireAck | null> {
    try {
      const ack = await this.rt.acquireLock(taskId);
      if (ack?.ok && ack.lock) {
        this.setLock(taskId, { owner: ack.lock.owner, token: ack.lock.token });
      } else {
        this.ui.error(MESSAGES.ERROR.TASK_LOCKED_BY_OTHER);
      }
      return ack;
    } catch (error) {
      const taskError = new TaskOperationError('lock', taskId, error);
      console.error('[TaskStore]', taskError);
      this.ui.error(MESSAGES.ERROR.LOCK_ACQUIRE_FAILED);
      return null;
    }
  }

  private isSuccessfulLockRelease(res: unknown): boolean {
    if (typeof res !== 'object' || res === null) {
      return false;
    }

    const response = res as Record<string, unknown>;
    const hasOkProperty = 'ok' in response && Boolean(response['ok']);
    const hasValidStatus =
      'status' in response &&
      APP_CONSTANTS.LOCK_SUCCESS_STATUSES.includes(Number(response['status']) as any);

    return hasOkProperty || hasValidStatus;
  }

  async releaseLock(taskId: string): Promise<void> {
    try {
      const token = this.locks.get(taskId)?.token;
      const res = await this.rt.releaseLock(taskId, token);

      if (this.isSuccessfulLockRelease(res)) {
        this.clearLock(taskId);
      } else {
        console.error(`[TaskStore] ${MESSAGES.ERROR.LOCK_RELEASE_REFUSED} ${taskId}; keeping local lock.`);
      }
    } catch (error) {
      const taskError = new TaskOperationError('unlock', taskId, error);
      console.error('[TaskStore]', taskError);
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
