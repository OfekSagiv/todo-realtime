// Core domain types
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// API response types
export interface ApiTask {
  _id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

// WebSocket event types
export interface TaskEventPayload {
  id?: string;
  _id?: string;
  title?: string;
  completed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Lock related types
export interface LockInfo {
  owner: string;
  token?: string;
}

export interface LockAcquireResponse {
  ok: boolean;
  lock?: { taskId: string; owner: string; token: string };
  reason?: string;
  owner?: string;
}

export interface LockReleaseResponse {
  ok: boolean;
  message?: string;
  reason?: string;
}

// Form DTOs
export interface CreateTaskDto {
  title: string;
}

export interface UpdateTaskDto {
  title?: string;
  completed?: boolean;
}
