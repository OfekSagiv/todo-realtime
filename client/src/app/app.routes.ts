import { Routes } from '@angular/router';
import {TasksPageComponent} from './pages/tasks-page.component';

export const routes: Routes = [
  { path: '', component: TasksPageComponent },
  { path: '**', redirectTo: '' },
];
