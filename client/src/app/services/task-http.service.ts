import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Task, ApiTask, CreateTaskDto, UpdateTaskDto } from '../types/task.types';
import { APP_CONSTANTS } from '../constants/app.constants';

function mapTask(t: ApiTask): Task {
  return {
    id: t._id,
    title: t.title,
    completed: t.completed,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

@Injectable({ providedIn: 'root' })
export class TaskHttpService {
  private readonly base = `${environment.apiBaseUrl}${APP_CONSTANTS.API_ENDPOINTS.TASKS}`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Task[]> {
    return this.http.get<ApiTask[]>(this.base).pipe(map(list => list.map(mapTask)));
  }

  getById(id: string): Observable<Task> {
    return this.http.get<ApiTask>(`${this.base}/${id}`).pipe(map(mapTask));
  }

  create(dto: CreateTaskDto): Observable<Task> {
    return this.http.post<ApiTask>(this.base, dto).pipe(map(mapTask));
  }

  update(id: string, dto: UpdateTaskDto, lockToken?: string): Observable<Task> {
    const headers = lockToken ? new HttpHeaders({ 'X-Lock-Token': lockToken }) : undefined;
    return this.http.put<ApiTask>(`${this.base}/${id}`, dto, { headers }).pipe(map(mapTask));
  }

  delete(id: string, lockToken?: string): Observable<{ id: string }> {
    const headers = lockToken ? new HttpHeaders({ 'X-Lock-Token': lockToken }) : undefined;
    return this.http.delete<{ id: string }>(`${this.base}/${id}`, { headers });
  }
}
