import { User } from './user.model';

export interface Department {
  id: number;
  name: string;
  description: string;
  deptHead?: User;
  officers?: User[];
  createdAt?: string;
}
