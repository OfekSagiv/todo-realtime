import {Component, OnInit, signal, DestroyRef, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatChipsModule} from '@angular/material/chips';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDividerModule} from '@angular/material/divider';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TaskStore} from '../store/task.store';
import {Task} from '../types/task.types';
import {Observable} from 'rxjs';
import {RealtimeService} from '../services/realtime.service';
import {UiService} from '../services/ui.service';
import {ToastComponent} from '../components/toast/toast.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import { APP_CONSTANTS } from '../constants/app.constants';
import { MESSAGES } from '../constants/messages.constants';

@Component({
    selector: 'app-tasks-page',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ToastComponent,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        MatTooltipModule
    ],
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

    readonly APP_CONSTANTS = APP_CONSTANTS;
    readonly MESSAGES = MESSAGES;

    async ngOnInit() {
        this.createForm = this.fb.group({
            title: ['', [
                Validators.required,
                Validators.minLength(APP_CONSTANTS.VALIDATION.TASK_TITLE_MIN_LENGTH),
                Validators.maxLength(APP_CONSTANTS.VALIDATION.TASK_TITLE_MAX_LENGTH)
            ]],
        });

        this.editForm = this.fb.group({
            title: ['', [
                Validators.required,
                Validators.minLength(APP_CONSTANTS.VALIDATION.TASK_TITLE_MIN_LENGTH),
                Validators.maxLength(APP_CONSTANTS.VALIDATION.TASK_TITLE_MAX_LENGTH)
            ]],
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
            this.ui.error(MESSAGES.ERROR.TASK_LOCKED_BY_OTHER);
            return;
        }

        this.loadingTaskId.set(task.id);
        try {
            const ack = await this.store.acquireLock(task.id);
            if (ack && ack.ok) {
                this.editingId.set(task.id);
                this.editForm.setValue({title: task.title ?? ''});
            } else {
                this.ui.error(MESSAGES.ERROR.TASK_LOCKED_BY_OTHER);
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
            this.ui.error(MESSAGES.ERROR.TASK_LOCKED_BY_OTHER);
            return;
        }
        const res = await this.store.remove(task.id);
        if (res) {
            if (this.editingId() === task.id) {
                this.editingId.set(null);
                this.resetEditForm();
            }
        }
    }

    trackById(_index: number, task: Task): string {
        return task.id;
    }

    private resetCreateForm(): void {
        this.createForm.reset();
        this.createForm.markAsUntouched();
        this.createForm.markAsPristine();
        Object.keys(this.createForm.controls).forEach(key => {
            this.createForm.get(key)?.setErrors(null);
        });
    }

    private resetEditForm(): void {
        this.editForm.reset({title: ''}, {emitEvent: false});
    }
}
