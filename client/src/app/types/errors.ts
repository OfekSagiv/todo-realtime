export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export class TaskOperationError extends Error {
  constructor(
    public readonly operation: string,
    public readonly taskId: string | null,
    public readonly originalError: unknown
  ) {
    super(`Task ${operation} failed${taskId ? ` for task ${taskId}` : ''}`);
    this.name = 'TaskOperationError';
  }
}

export class LockError extends Error {
  constructor(
    public readonly taskId: string,
    public readonly reason: 'already_locked' | 'timeout' | 'network_error'
  ) {
    super(`Lock operation failed for task ${taskId}: ${reason}`);
    this.name = 'LockError';
  }
}
