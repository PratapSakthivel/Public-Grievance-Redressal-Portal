import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge px-3 py-2 rounded-pill font-weight-semibold shadow-2xs text-uppercase tracking-wider"
          [ngStyle]="getStyle(status)">
      {{ getLabel(status) }}
    </span>
  `,
  styles: [`
    .badge {
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      transition: all 0.2s ease-in-out;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status: string = 'FILED';

  getStyle(status: string): { [key: string]: string } {
    switch (status?.toUpperCase()) {
      case 'FILED':
        return { backgroundColor: '#64748b', color: '#ffffff' }; // slate
      case 'ASSIGNED':
        return { backgroundColor: '#0284c7', color: '#ffffff' }; // sky blue
      case 'IN_PROGRESS':
        return { backgroundColor: '#d97706', color: '#ffffff' }; // amber
      case 'RESOLVED':
        return { backgroundColor: '#059669', color: '#ffffff' }; // emerald green
      case 'REOPENED':
        return { backgroundColor: '#ea580c', color: '#ffffff' }; // orange
      case 'CLOSED':
        return { backgroundColor: '#334155', color: '#ffffff' }; // dark slate
      default:
        return { backgroundColor: '#94a3b8', color: '#ffffff' };
    }
  }

  getLabel(status: string): string {
    if (!status) return 'FILED';
    return status.replace('_', ' ');
  }
}
