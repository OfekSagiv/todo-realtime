import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TaskUiStateService {
  private readonly _editingId = signal<string | null>(null);
  private readonly _isCreating = signal(false);
  private readonly _isUpdating = signal(false);
  private readonly _loadingTaskId = signal<string | null>(null);

  readonly editingId = this._editingId.asReadonly();
  readonly isCreating = this._isCreating.asReadonly();
  readonly isUpdating = this._isUpdating.asReadonly();
  readonly loadingTaskId = this._loadingTaskId.asReadonly();

  setEditingTask(taskId: string): void {
    this._editingId.set(taskId);
  }

  clearEditingTask(): void {
    this._editingId.set(null);
  }

  setCreating(creating: boolean): void {
    this._isCreating.set(creating);
  }

  setUpdating(updating: boolean): void {
    this._isUpdating.set(updating);
  }

  setLoadingTask(taskId: string): void {
    this._loadingTaskId.set(taskId);
  }

  clearLoadingTask(): void {
    this._loadingTaskId.set(null);
  }

  isTaskLoading(taskId: string): boolean {
    return this._loadingTaskId() === taskId;
  }

  isTaskEditing(taskId: string): boolean {
    return this._editingId() === taskId;
  }
}
