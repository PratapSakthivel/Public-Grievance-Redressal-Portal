import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintStatus } from '../../models/complaint.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="'badge-' + status.toLowerCase()">
      {{ dot }} {{ label }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status!: ComplaintStatus;

  get dot(): string {
    const dots: Record<ComplaintStatus, string> = {
      FILED: '●', ASSIGNED: '◐', IN_PROGRESS: '⟳', RESOLVED: '✓', CLOSED: '✕', REOPENED: '↩'
    };
    return dots[this.status] || '●';
  }

  get label(): string {
    return this.status.replace('_', ' ');
  }
}
