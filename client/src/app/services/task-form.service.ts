import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { APP_CONSTANTS } from '../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class TaskFormService {
  private _createForm!: FormGroup;
  private _editForm!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.initializeForms();
  }

  get createForm(): FormGroup {
    return this._createForm;
  }

  get editForm(): FormGroup {
    return this._editForm;
  }

  private initializeForms(): void {
    const validators = [
      Validators.required,
      Validators.minLength(APP_CONSTANTS.VALIDATION.TASK_TITLE_MIN_LENGTH),
      Validators.maxLength(APP_CONSTANTS.VALIDATION.TASK_TITLE_MAX_LENGTH)
    ];

    this._createForm = this.fb.group({
      title: ['', validators]
    });

    this._editForm = this.fb.group({
      title: ['', validators]
    });
  }

  canCreate(): boolean {
    return this._createForm.valid && !!this.getCreateTitle();
  }

  canEdit(taskId: string, editingId: string | null): boolean {
    return editingId === taskId && this._editForm.valid;
  }

  getCreateTitle(): string {
    return String(this._createForm.value.title || '').trim();
  }

  getEditTitle(): string {
    return String(this._editForm.value.title || '').trim();
  }

  setEditValue(title: string): void {
    this._editForm.setValue({ title });
  }

  resetCreateForm(): void {
    this._createForm.reset();
    this._createForm.markAsUntouched();
    this._createForm.markAsPristine();
    this.clearFormErrors(this._createForm);
  }

  resetEditForm(): void {
    this._editForm.reset({ title: '' }, { emitEvent: false });
  }

  private clearFormErrors(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.setErrors(null);
    });
  }
}
