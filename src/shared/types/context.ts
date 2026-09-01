export interface AuthUserContext {
  id: string;
  tenantId: string;
  phone: string;
  name: string;
  roles: string[];
  permissions: string[];
  branchIds: string[];
  isSuperAdmin?: boolean;
}

export interface RequestContext {
  requestId: string;
  tenantId?: string;
  branchId?: string;
  user?: AuthUserContext;
  sessionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}
