export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_email?: string;
  action: string;
  resource: string;
  resource_id?: string;
  status: "success" | "failure" | "error";
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
}

export interface AuditLogFilters {
  action?: string;
  user_id?: string;
  resource?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  total_events: number;
  events_today: number;
  unique_users: number;
  by_action: Record<string, number>;
  by_status: Record<string, number>;
  by_resource: Record<string, number>;
}
