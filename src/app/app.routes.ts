import { Routes } from '@angular/router';
import { AssessmentComponent } from './components/assessment/assessment.component';

export const routes: Routes = [
  { path: '', redirectTo: 'main', pathMatch: 'full' },
  { path: 'main', component: AssessmentComponent }
];
