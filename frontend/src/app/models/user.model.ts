export type Role = 'CITIZEN' | 'OFFICER' | 'DEPT_HEAD' | 'SUPER_ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  departmentId?: number;
  createdAt?: string;
  updatedAt?: string;
}
