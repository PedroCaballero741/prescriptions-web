export type PrescriptionStatus = "pending" | "consumed" | string;

export interface PrescriptionItem {
  id: string;
  name: string;
  dosage: string | null;
  quantity: number | null;
  instructions: string | null;
}

export interface PrescriptionUser {
  id: string;
  email: string;
  name: string;
}

export interface PrescriptionPerson {
  id: string;
  user: PrescriptionUser;
}

export interface Prescription {
  id: string;
  code: string;
  status: PrescriptionStatus;
  notes: string | null;
  createdAt: string;
  consumedAt: string | null;
  items: PrescriptionItem[];
  patient: PrescriptionPerson;
  author: PrescriptionPerson;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminMetricsResponse {
  totals?: {
    doctors?: number;
    patients?: number;
    prescriptions?: number;
  };
  byStatus?: Record<string, number>;
  byDay?: Array<{ date: string; count: number }>;
  topDoctors?: Array<{ doctorId: string; name: string; count: number }>;
  total?: number;
  consumed?: number;
  pending?: number;
  consumptionRate?: number;
}
