import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TaskHttpService, Task, CreateTaskDto, UpdateTaskDto } from '../services/task-http.service';
import { RealtimeService, LockAcquireAck } from '../services/realtime.service';

type LockInfo = { owner: string; token?: string };

@Injectable({ providedIn: 'root' })
export class TaskStore implements OnDestroy {
  private readonly _tasks$ = new BehaviorSubject<Task[]>([]);
  readonly tasks$ = this._tasks$.asObservable();

  private readonly locks = new Map<string, LockInfo>();
  private readonly destroyed$ = new Subject<void>();

  constructor(
    private http: TaskHttpService,
    private rt: RealtimeService
  ) {
    this.rt.taskCreated$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((task) => this.upsertTask(task));

    this.rt.taskUpdated$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((task) => this.upsertTask(task));

    this.rt.taskDeleted$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ id }) => this.removeLocal(id));

    this.rt.taskLocked$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ taskId, owner }) => this.setLock(taskId, { owner }));

    this.rt.taskUnlocked$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ taskId }) => this.clearLock(taskId));
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
      return created;
    } catch (error) {
      console.error('[TaskStore] Failed to create task:', error);
      return null;
    }
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task | null> {
    try {
      const token = this.locks.get(id)?.token;
      const updated = await firstValueFrom(this.http.update(id, dto, token));
      this.upsertTask(updated);
      return updated;
    } catch (error) {
      console.error(`[TaskStore] Failed to update task ${id}:`, error);
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
      console.error(`[TaskStore] Failed to delete task ${id}:`, error);
      return null;
    }
  }

  async acquireLock(taskId: string): Promise<LockAcquireAck | null> {
    try {
      const ack = await this.rt.acquireLock(taskId);
      if (ack.ok && ack.lock) {
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
      await this.rt.releaseLock(taskId, token);
      this.clearLock(taskId);
    } catch (error) {
      console.error(`[TaskStore] Failed to release lock for task ${taskId}:`, error);
    }
  }

  getLock(taskId: string): LockInfo | undefined {
    return this.locks.get(taskId);
  }

  isLocked(taskId: string): boolean {
    return this.locks.has(taskId);
  }

  mySocketId(): string | undefined {
    return this.rt.getSocketId();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  private upsertTask(task: Task): void {
    const copy = [...this._tasks$.value];
    const idx = copy.findIndex(t => t.id === task.id);
    if (idx === -1) copy.unshift(task);
    else copy[idx] = task;
    this._tasks$.next(copy);
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
