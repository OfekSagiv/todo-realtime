import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskStore } from '../store/task.store';
import { Task } from '../services/task-http.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tasks-page.component.html',
  styleUrls: ['./tasks-page.component.scss'],
})
export class TasksPageComponent implements OnInit {
  createForm!: FormGroup;
  editingId = signal<string | null>(null);
  editForm!: FormGroup;

  tasks$!: Observable<Task[]>;

  constructor(private store: TaskStore, private fb: FormBuilder) {}

  async ngOnInit() {
    this.createForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1)]],
    });

    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1)]],
    });

    this.tasks$ = this.store.tasks$;
    await this.store.loadAll();
  }

  get myId(): string | undefined {
    return this.store.mySocketId();
  }

  async create() {
    if (this.createForm.invalid) return;
    const title = String(this.createForm.value.title).trim();
    if (!title) return;
    await this.store.create({ title });
    this.resetCreateForm();
  }

  isLocked(task: Task) {
    return this.store.isLocked(task.id);
  }

  isLockedByMe(task: Task) {
    return this.store.isLockedByMe(task.id);
  }

  async startEdit(task: Task) {
    if (this.isLocked(task) && !this.isLockedByMe(task)) return;
    const ack = await this.store.acquireLock(task.id);
    if (ack && ack.ok) {
      this.editingId.set(task.id);
      this.editForm.setValue({ title: task.title ?? '' });
    }
  }

  cancelEdit() {
    const id = this.editingId();
    if (!id) return;
    this.store.releaseLock(id);
    this.editingId.set(null);
    this.resetEditForm();
  }

  async saveEdit(task: Task) {
    if (this.editingId() !== task.id || this.editForm.invalid) return;
    const title = String(this.editForm.value.title).trim();
    await this.store.update(task.id, { title });
    await this.store.releaseLock(task.id);
    this.editingId.set(null);
    this.resetEditForm();
  }

  async remove(task: Task) {
    if (this.isLocked(task) && !this.isLockedByMe(task)) return;
    await this.store.remove(task.id);
    if (this.editingId() === task.id) {
      this.editingId.set(null);
      this.resetEditForm();
    }
  }

  trackById(_index: number, task: Task): string {
    return task.id;
  }

  private resetCreateForm(): void {
    this.createForm.reset({ title: '' }, { emitEvent: false });
  }

  private resetEditForm(): void {
    this.editForm.reset({ title: '' }, { emitEvent: false });
  }
}
