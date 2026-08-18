import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization header if token is stored in localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('statusenzin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
        if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('statusenzin_token');
        const currentPath = window.location.pathname;
        if (
          currentPath.startsWith('/dashboard') ||
          currentPath.startsWith('/platform-admin') ||
          currentPath.startsWith('/checkout')
        ) {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath + window.location.search)}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export interface UserAuth {
  token: string;
  email: string;
  fullName: string;
  tenantId: string;
  tenantName: string;
  isPlatformAdmin: boolean;
}

export interface MonitorItem {
  id: string;
  name: string;
  url: string;
  checkIntervalSeconds: number;
  expectedStatusCode: number;
  status: 'Operational' | 'Degraded' | 'Down';
  lastLatencyMs: number;
  uptimePercentage: number;
  lastCheckedAt?: string;
  nextCheckAt: string;
  recentChecks?: Array<{
    id: string;
    statusCode: number;
    responseTimeMs: number;
    isSuccess: boolean;
    checkedAt: string;
  }>;
}

export interface StatusPageItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  isPublic: boolean;
  componentIdsJson: string;
  createdAt: string;
  incidents?: IncidentItem[];
  subscribers?: any[];
}

export interface IncidentUpdateItem {
  id: string;
  status: 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved';
  message: string;
  createdAt: string;
}

export interface IncidentItem {
  id: string;
  statusPageId: string;
  title: string;
  status: 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved';
  impact: 'Minor' | 'Major' | 'Critical' | 'Degraded';
  message: string;
  createdAt: string;
  updatedAt: string;
  updates?: IncidentUpdateItem[];
}

export interface PublicStatusData {
  id: string;
  name: string;
  slug: string;
  description: string;
  tenantName: string;
  globalStatus: 'Operational' | 'Degraded Performance' | 'Major Outage';
  monitors: Array<{
    id: string;
    name: string;
    status: 'Operational' | 'Degraded' | 'Down';
    uptimePercentage: number;
    lastLatencyMs: number;
    lastCheckedAt?: string;
    checksHistory: Array<{
      isSuccess: boolean;
      responseTimeMs: number;
      checkedAt: string;
    }>;
  }>;
  incidents: IncidentItem[];
}
