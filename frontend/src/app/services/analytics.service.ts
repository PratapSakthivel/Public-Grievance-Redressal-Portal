import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AnalyticsData {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  statusBreakdown: { [key: string]: number };
  categoryDistribution: { [key: string]: number };
  topPincodes: { pincode: string; count: number; areaName: string }[];
  monthlyTrends: { month: string; filed: number; resolved: number }[];
  departmentComparison: { [key: string]: number };
  averageResolutionTime: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private baseUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  getGlobalStats(): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(`${this.baseUrl}/global`);
  }

  getDepartmentStats(id: number): Observable<AnalyticsData> {
    return this.http.get<AnalyticsData>(`${this.baseUrl}/department/${id}`);
  }
}
