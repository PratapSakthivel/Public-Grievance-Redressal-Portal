import { Routes } from '@angular/router';
import { PublicFeedComponent } from './components/public-feed/public-feed.component';
import { ComplaintDetailComponent } from './components/complaint-detail/complaint-detail.component';
import { FileComplaintComponent } from './components/file-complaint/file-complaint.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DeptHeadDashboardComponent } from './components/dept-head-dashboard/dept-head-dashboard.component';
import { AdminAnalyticsComponent } from './components/admin-analytics/admin-analytics.component';
import { AdminUsersComponent } from './components/admin-users/admin-users.component';
import { OfficerDashboardComponent } from './components/officer-dashboard/officer-dashboard.component';
import { CitizenDashboardComponent } from './components/citizen-dashboard/citizen-dashboard.component';

export const routes: Routes = [
  // Public
  { path: '', component: PublicFeedComponent },
  { path: 'complaints/:id', component: ComplaintDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Citizen
  { path: 'my-complaints', component: CitizenDashboardComponent },
  { path: 'file-complaint', component: FileComplaintComponent },

  // Field Officer
  { path: 'officer/dashboard', component: OfficerDashboardComponent },

  // Dept Head
  { path: 'dept-head/dashboard', component: DeptHeadDashboardComponent },

  // Super Admin
  { path: 'admin/analytics', component: AdminAnalyticsComponent },
  { path: 'admin/users', component: AdminUsersComponent },

  { path: '**', redirectTo: '' }
];
