import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export type Task = { _id: string; title: string; completed: boolean; createdAt: string; updatedAt: string };

@Injectable({ providedIn: 'root' })
export class TaskHttpService {
  private readonly base = `${environment.apiBaseUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Task[]> {
    return this.http.get<Task[]>(this.base);
  }

  getById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.base}/${id}`);
  }

  create(dto: { title: string }): Observable<Task> {
    return this.http.post<Task>(this.base, dto);
  }

  update(id: string, dto: Partial<Pick<Task, 'title'|'completed'>>, lockToken?: string): Observable<Task> {
    const headers = lockToken ? new HttpHeaders({ 'X-Lock-Token': lockToken }) : undefined;
    return this.http.put<Task>(`${this.base}/${id}`, dto, { headers });
  }

  delete(id: string, lockToken?: string): Observable<{ id: string }> {
    const headers = lockToken ? new HttpHeaders({ 'X-Lock-Token': lockToken }) : undefined;
    return this.http.delete<{ id: string }>(`${this.base}/${id}`, { headers });
  }
}
