import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/public', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'public',
    loadComponent: () => import('./pages/public-feed/public-feed.component').then(m => m.PublicFeedComponent)
  },
  {
    path: 'complaints/:id',
    loadComponent: () => import('./pages/complaint-detail/complaint-detail.component').then(m => m.ComplaintDetailComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/citizen-dashboard/citizen-dashboard.component').then(m => m.CitizenDashboardComponent)
  },
  {
    path: 'file-complaint',
    canActivate: [authGuard],
    data: { roles: ['CITIZEN'] },
    loadComponent: () => import('./pages/file-complaint/file-complaint.component').then(m => m.FileComplaintComponent)
  },
  {
    path: 'officer-dashboard',
    canActivate: [authGuard],
    data: { roles: ['OFFICER', 'DEPT_HEAD'] },
    loadComponent: () => import('./pages/officer-dashboard/officer-dashboard.component').then(m => m.OfficerDashboardComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { roles: ['SUPER_ADMIN'] },
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  { path: '**', redirectTo: '/public' }
];
