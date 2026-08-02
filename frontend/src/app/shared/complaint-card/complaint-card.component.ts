import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Complaint } from '../../models/complaint.model';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { TimeAgoPipe } from '../time-ago.pipe';

@Component({
  selector: 'app-complaint-card',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, TimeAgoPipe],
  template: `
    <a [routerLink]="['/complaints', complaint.id]" class="complaint-card">
      <div class="card-header">
        <app-status-badge [status]="complaint.status"></app-status-badge>
        <span class="priority-badge" [class]="'badge badge-' + complaint.priority.toLowerCase()">
          {{ complaint.priority }}
        </span>
      </div>
      <h4 class="card-title">{{ complaint.title }}</h4>
      <p class="card-desc">{{ complaint.description | slice:0:120 }}{{ complaint.description.length > 120 ? '...' : '' }}</p>
      <div class="card-meta">
        <span class="meta-item">🏢 {{ complaint.departmentName }}</span>
        <span class="meta-item">📍 {{ complaint.areaName || complaint.pincode }}</span>
        <span class="meta-item">🗓 {{ complaint.createdAt | timeAgo }}</span>
      </div>
      <div class="card-footer">
        <div class="upvotes" [class.upvoted]="complaint.hasUpvoted">
          <span class="upvote-icon">▲</span>
          <span>{{ complaint.upvoteCount }}</span>
        </div>
        <span class="category-tag">{{ complaint.category }}</span>
        <span class="citizen">by {{ complaint.citizenName }}</span>
      </div>
    </a>
  `,
  styles: [`
    .complaint-card {
      display: flex; flex-direction: column; gap: 0.75rem;
      background: var(--bg-card); border: 1px solid var(--border-subtle);
      border-radius: var(--radius); padding: 1.25rem;
      text-decoration: none; color: var(--text);
      transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
      cursor: pointer;
    }
    .complaint-card:hover {
      border-color: rgba(99,102,241,0.4);
      transform: translateY(-3px);
      box-shadow: 0 8px 30px rgba(99,102,241,0.15);
    }
    .card-header { display: flex; align-items: center; gap: 0.5rem; }
    .card-title { font-size: 1rem; font-weight: 600; color: var(--text); line-height: 1.4; }
    .card-desc { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }
    .card-meta { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .meta-item { font-size: 0.8rem; color: var(--text-dim); }
    .card-footer { display: flex; align-items: center; gap: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle); }
    .upvotes {
      display: flex; align-items: center; gap: 0.35rem;
      font-size: 0.825rem; font-weight: 600; color: var(--text-muted);
    }
    .upvotes.upvoted { color: #6366f1; }
    .upvote-icon { font-size: 0.75rem; }
    .category-tag {
      font-size: 0.75rem; background: rgba(6,182,212,0.1); color: #67e8f9;
      padding: 0.2rem 0.6rem; border-radius: 100px; border: 1px solid rgba(6,182,212,0.2);
    }
    .citizen { font-size: 0.8rem; color: var(--text-dim); margin-left: auto; }
  `]
})
export class ComplaintCardComponent {
  @Input() complaint!: Complaint;
}
