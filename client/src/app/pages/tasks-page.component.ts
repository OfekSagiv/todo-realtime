import {Component, OnInit, signal, DestroyRef, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TaskStore} from '../store/task.store';
import {Task} from '../types/task.types';
import {Observable} from 'rxjs';
import {RealtimeService} from '../services/realtime.service';
import {UiService} from '../services/ui.service';
import {ToastComponent} from '../components/toast/toast.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-tasks-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ToastComponent],
    templateUrl: './tasks-page.component.html',
    styleUrls: ['./tasks-page.component.scss'],
})
export class TasksPageComponent implements OnInit {
    createForm!: FormGroup;
    editingId = signal<string | null>(null);
    editForm!: FormGroup;


    isCreating = signal(false);
    isUpdating = signal(false);
    loadingTaskId = signal<string | null>(null);

    tasks$!: Observable<Task[]>;

    private readonly destroyRef = inject(DestroyRef);

    constructor(
        private store: TaskStore,
        private fb: FormBuilder,
        private rt: RealtimeService,
        private ui: UiService
    ) {
    }

    async ngOnInit() {
        this.createForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(1)]],
        });

        this.editForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(1)]],
        });

        this.tasks$ = this.store.tasks$;
        await this.store.loadAll();

        this.rt.disconnected$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                const id = this.editingId();
                if (id) {
                    this.editingId.set(null);
                    this.resetEditForm();
                }
                this.store.clearAllLocksLocal();
                this.ui.info('Realtime connection lost; edit mode cleared');
            });
    }

    get myId(): string | undefined {
        return this.store.mySocketId();
    }

    isLocked(task: Task): boolean {
        return this.store.isLocked(task.id);
    }

    isLockedByMe(task: Task): boolean {
        return this.store.isLockedByMe(task.id);
    }

    async create() {
        if (this.createForm.invalid || this.isCreating()) return;
        const title = String(this.createForm.value.title).trim();
        if (!title) return;

        this.isCreating.set(true);
        try {
            await this.store.create({title});
            this.resetCreateForm();
        } finally {
            this.isCreating.set(false);
        }
    }

    async startEdit(task: Task) {
        if (this.isLocked(task) && !this.isLockedByMe(task)) {
            this.ui.error('Task is locked by another editor');
            return;
        }

        this.loadingTaskId.set(task.id);
        try {
            const ack = await this.store.acquireLock(task.id);
            if (ack && ack.ok) {
                this.editingId.set(task.id);
                this.editForm.setValue({title: task.title ?? ''});
            } else {
                this.ui.error('Task is locked by another editor');
            }
        } finally {
            this.loadingTaskId.set(null);
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
        if (this.editingId() !== task.id || this.editForm.invalid || this.isUpdating()) return;
        const title = String(this.editForm.value.title).trim();

        this.isUpdating.set(true);
        try {
            await this.store.update(task.id, {title});
            await this.store.releaseLock(task.id);
            this.editingId.set(null);
            this.resetEditForm();
        } finally {
            this.isUpdating.set(false);
        }
    }

    async remove(task: Task) {
        if (this.isLocked(task) && !this.isLockedByMe(task)) {
            this.ui.error('Task is locked by another editor');
            return;
        }
        const res = await this.store.remove(task.id);
        if (res) {
            if (this.editingId() === task.id) {
                this.editingId.set(null);
                this.resetEditForm();
            }
        } else {
            this.ui.error('Task is locked by another editor');
        }
    }

    trackById(_index: number, task: Task): string {
        return task.id;
    }

    private resetCreateForm(): void {
        this.createForm.reset({title: ''}, {emitEvent: false});
    }

    private resetEditForm(): void {
        this.editForm.reset({title: ''}, {emitEvent: false});
    }
}
