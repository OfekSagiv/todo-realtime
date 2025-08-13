import {Component, OnInit, DestroyRef, inject, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
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
import { TaskFormService } from '../services/task-form.service';
import { TaskUiStateService } from '../services/task-ui-state.service';

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
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksPageComponent implements OnInit {
    tasks$!: Observable<Task[]>;
    private readonly destroyRef = inject(DestroyRef);

    constructor(
        private store: TaskStore,
        private rt: RealtimeService,
        private ui: UiService,
        public formService: TaskFormService,
        public uiState: TaskUiStateService
    ) {
        this.tasks$ = this.store.tasks$;
    }

    readonly APP_CONSTANTS = APP_CONSTANTS;
    readonly MESSAGES = MESSAGES;

    get createForm() { return this.formService.createForm; }
    get editForm() { return this.formService.editForm; }
    get editingId() { return this.uiState.editingId; }
    get isCreating() { return this.uiState.isCreating; }
    get isUpdating() { return this.uiState.isUpdating; }
    get loadingTaskId() { return this.uiState.loadingTaskId; }

    ngOnInit() {
        this.store.loadAll();
        this.setupRealtimeSubscriptions();
    }

    private setupRealtimeSubscriptions(): void {
        this.rt.disconnected$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.cancelEdit();
                this.store.clearAllLocksLocal();
            });
    }

    get myId(): string | undefined {
        return this.rt.getSocketId();
    }

    isLocked(task: Task): boolean {
        return this.store.isLocked(task.id);
    }

    isLockedByMe(task: Task): boolean {
        return this.store.isLockedByMe(task.id);
    }

    async create() {
        if (!this.formService.canCreate()) return;

        this.uiState.setCreating(true);
        try {
            const title = this.formService.getCreateTitle();
            await this.store.create({title});
            this.formService.resetCreateForm();
        } finally {
            this.uiState.setCreating(false);
        }
    }

    async startEdit(task: Task) {
        if (this.isLocked(task) && !this.isLockedByMe(task)) {
            this.ui.error(MESSAGES.ERROR.TASK_LOCKED_BY_OTHER);
            return;
        }

        this.uiState.setLoadingTask(task.id);
        try {
            const ack = await this.store.acquireLock(task.id);
            if (ack?.ok) {
                this.uiState.setEditingTask(task.id);
                this.formService.setEditValue(task.title);
            } else {
                this.ui.error(MESSAGES.ERROR.TASK_LOCKED_BY_OTHER);
            }
        } finally {
            this.uiState.clearLoadingTask();
        }
    }

    cancelEdit() {
        const id = this.uiState.editingId();
        if (!id) return;

        this.store.releaseLock(id);
        this.uiState.clearEditingTask();
        this.formService.resetEditForm();
    }

    async saveEdit(task: Task) {
        if (!this.formService.canEdit(task.id, this.uiState.editingId())) return;

        this.uiState.setUpdating(true);
        try {
            const title = this.formService.getEditTitle();
            await this.store.update(task.id, {title});
            await this.store.releaseLock(task.id);
            this.uiState.clearEditingTask();
            this.formService.resetEditForm();
        } finally {
            this.uiState.setUpdating(false);
        }
    }

    async remove(task: Task) {
        if (this.isLocked(task) && !this.isLockedByMe(task)) {
            this.ui.error(MESSAGES.ERROR.TASK_LOCKED_BY_OTHER);
            return;
        }

        const res = await this.store.remove(task.id);
        if (res && this.uiState.editingId() === task.id) {
            this.uiState.clearEditingTask();
            this.formService.resetEditForm();
        }
    }

    trackById(_index: number, task: Task): string {
        return task.id;
    }
}
