import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Complaint, ComplaintStatus } from '../models/complaint.model';

export interface ComplaintRequest {
  title: string;
  description: string;
  category: string;
  pincode: string;
  areaName?: string;
  departmentId: number;
  priority?: string;
}

export interface ComplaintUpdateRequest {
  newStatus?: ComplaintStatus;
  remarks?: string;
  assignedOfficerId?: number;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  private baseUrl = `${environment.apiUrl}/complaints`;

  constructor(private http: HttpClient) {}

  getPublicFeed(): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.baseUrl}/public`);
  }

  getMyComplaints(): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.baseUrl}/my`);
  }

  getAssignedComplaints(): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.baseUrl}/assigned`);
  }

  getDepartmentComplaints(deptId: number): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.baseUrl}/department/${deptId}`);
  }

  getComplaintById(id: number): Observable<Complaint> {
    return this.http.get<Complaint>(`${this.baseUrl}/${id}`);
  }

  fileComplaint(request: ComplaintRequest): Observable<Complaint> {
    return this.http.post<Complaint>(this.baseUrl, request);
  }

  toggleUpvote(id: number): Observable<Complaint> {
    return this.http.post<Complaint>(`${this.baseUrl}/${id}/upvote`, {});
  }

  assignOfficer(complaintId: number, officerId: number): Observable<Complaint> {
    return this.http.put<Complaint>(`${this.baseUrl}/${complaintId}/assign`, { assignedOfficerId: officerId });
  }

  updateStatus(complaintId: number, request: ComplaintUpdateRequest): Observable<Complaint> {
    return this.http.put<Complaint>(`${this.baseUrl}/${complaintId}/status`, request);
  }

  getSimilarComplaints(category: string, pincode: string): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.baseUrl}/similar`, {
      params: new HttpParams().set('category', category).set('pincode', pincode)
    });
  }

  searchComplaints(filters: {
    category?: string;
    pincode?: string;
    status?: string;
    departmentId?: number;
    page?: number;
    size?: number;
  }): Observable<PagedResponse<Complaint>> {
    let params = new HttpParams();
    if (filters.category) params = params.set('category', filters.category);
    if (filters.pincode) params = params.set('pincode', filters.pincode);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.departmentId) params = params.set('departmentId', filters.departmentId);
    if (filters.page !== undefined) params = params.set('page', filters.page);
    if (filters.size !== undefined) params = params.set('size', filters.size);
    return this.http.get<PagedResponse<Complaint>>(`${this.baseUrl}/search`, { params });
  }
}
