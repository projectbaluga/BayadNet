export const PERMISSIONS = {
  VIEW_SUBSCRIBERS: 'view_subscribers',
  MANAGE_SUBSCRIBERS: 'manage_subscribers',
  PROCESS_PAYMENTS: 'process_payments',
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_ROUTER_STATUS: 'view_router_status',
  MANAGE_ROUTERS: 'manage_routers',
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
  RESOLVE_ISSUES: 'resolve_issues',
  DOWNLOAD_SOA: 'download_soa'
};

export const DEFAULT_PERMISSIONS = {
  admin: {
    [PERMISSIONS.VIEW_SUBSCRIBERS]: true,
    [PERMISSIONS.MANAGE_SUBSCRIBERS]: true,
    [PERMISSIONS.PROCESS_PAYMENTS]: true,
    [PERMISSIONS.VIEW_ANALYTICS]: true,
    [PERMISSIONS.VIEW_ROUTER_STATUS]: true,
    [PERMISSIONS.MANAGE_ROUTERS]: true,
    [PERMISSIONS.MANAGE_USERS]: true,
    [PERMISSIONS.MANAGE_SETTINGS]: true,
    [PERMISSIONS.RESOLVE_ISSUES]: true,
    [PERMISSIONS.DOWNLOAD_SOA]: true
  },
  staff: {
    [PERMISSIONS.VIEW_SUBSCRIBERS]: true,
    [PERMISSIONS.MANAGE_SUBSCRIBERS]: false,
    [PERMISSIONS.PROCESS_PAYMENTS]: true,
    [PERMISSIONS.VIEW_ANALYTICS]: true,
    [PERMISSIONS.VIEW_ROUTER_STATUS]: true,
    [PERMISSIONS.MANAGE_ROUTERS]: false,
    [PERMISSIONS.MANAGE_USERS]: false,
    [PERMISSIONS.MANAGE_SETTINGS]: false,
    [PERMISSIONS.RESOLVE_ISSUES]: true,
    [PERMISSIONS.DOWNLOAD_SOA]: true
  },
  technician: {
    [PERMISSIONS.VIEW_SUBSCRIBERS]: true,
    [PERMISSIONS.MANAGE_SUBSCRIBERS]: false,
    [PERMISSIONS.PROCESS_PAYMENTS]: false,
    [PERMISSIONS.VIEW_ANALYTICS]: false,
    [PERMISSIONS.VIEW_ROUTER_STATUS]: true,
    [PERMISSIONS.MANAGE_ROUTERS]: false,
    [PERMISSIONS.MANAGE_USERS]: false,
    [PERMISSIONS.MANAGE_SETTINGS]: false,
    [PERMISSIONS.RESOLVE_ISSUES]: true,
    [PERMISSIONS.DOWNLOAD_SOA]: false
  }
};

export const getEffectivePermissions = (user) => {
  if (!user || !user.role) return {};
  const roleDefaults = DEFAULT_PERMISSIONS[user.role] || {};
  const overrides = user.permissions || {};

  // Create a copy of defaults
  const effective = { ...roleDefaults };

  // Apply overrides
  Object.keys(overrides).forEach(key => {
    effective[key] = overrides[key];
  });

  return effective;
};

export const hasPermission = (user, permission) => {
  const effective = getEffectivePermissions(user);
  return effective[permission] === true;
};
