export interface ServiceToServiceTokenPayload {
  iss: 'bexo-admin-panel';
  aud: 'bexo-college-panel' | 'bexo-mobile-backend';
  sub: string;
  scope: string[];
  role: 'service_admin' | 'corporate_sync';
  exp: number;
}

export interface CollegeSyncPayload {
  collegeId: string;
  status: 'Active' | 'Suspended';
  dashboardAccess?: boolean;
  quotaAllocated: number;
  services?: any;
  reason?: string;
  updatedAt?: string;
  timestamp?: string;
}

export interface StudentEntitlementSyncPayload {
  studentId: string;
  collegeId: string;
  rollNumber: string;
  email?: string;
  modules?: any;
  entitlementStatus?: 'Active' | 'Suspended' | 'Revoked';
  status?: string;
  reason?: string;
  timestamp?: string;
}

export interface DownstreamResponse<T = unknown> {
  success: boolean;
  data?: T;
  statusCode?: number;
  message?: string;
  error?: string;
}
