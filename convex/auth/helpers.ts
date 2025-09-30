import { ConvexError } from "convex/values";

export type Role = "admin" | "manager" | "user";

// Role hierarchy - higher numbers have more permissions
const ROLE_HIERARCHY: Record<Role, number> = {
  user: 1,
  manager: 2,
  admin: 3,
};

// Helper to check if a role has higher or equal permissions than another
export const hasHigherOrEqualRole = (
  userRole: Role,
  requiredRole: Role
): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Helper to get current user from Convex auth
export const getCurrentUser = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .first();

  if (!user) {
    throw new ConvexError("User not found in database");
  }

  return user;
};

// Helper to get current user (nullable version for queries)
export const getCurrentUserNullable = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .first();

  return user;
};

// Permission checking functions
export const canManageContent = (role: Role): boolean => {
  return hasHigherOrEqualRole(role, "manager");
};

export const canManageUsers = (role: Role): boolean => {
  return role === "admin";
};

export const canViewUsers = (role: Role): boolean => {
  return hasHigherOrEqualRole(role, "manager");
};

export const canModifyRole = (
  currentUserRole: Role,
  targetRole: Role,
  newRole: Role
): boolean => {
  // Only admins can modify admin roles
  if (targetRole === "admin" || newRole === "admin") {
    return currentUserRole === "admin";
  }

  // Admins can modify any non-admin role
  if (currentUserRole === "admin") {
    return true;
  }

  // Managers can only modify user roles
  if (currentUserRole === "manager" && targetRole === "user") {
    return newRole === "user" || newRole === "manager";
  }

  return false;
};

// Audit logging helper
export const logRoleChange = async (
  ctx: any,
  targetUserId: string,
  targetUserEmail: string,
  changedByUserId: string,
  changedByEmail: string,
  oldRole: string,
  newRole: string,
  reason?: string
) => {
  await ctx.db.insert("roleAuditLog", {
    targetUserId,
    targetUserEmail,
    changedByUserId,
    changedByEmail,
    oldRole,
    newRole,
    reason,
    timestamp: Date.now(),
  });
};

// Permission validation for specific actions
export const validatePermission = async (
  ctx: any,
  action: string,
  resource: string = "general"
) => {
  const currentUser = await getCurrentUser(ctx);

  // Check if permission is explicitly defined in the database
  const permission = await ctx.db
    .query("rolePermissions")
    .withIndex("by_role_action", (q) =>
      q.eq("role", currentUser.role).eq("action", action)
    )
    .first();

  if (permission) {
    if (!permission.allowed) {
      throw new ConvexError(`Permission denied: ${action} on ${resource}`);
    }
    return currentUser;
  }

  // Fallback to default role-based permissions
  switch (action) {
    case "create_content":
    case "update_content":
    case "delete_content":
      if (!canManageContent(currentUser.role as Role)) {
        throw new ConvexError("Insufficient permissions to manage content");
      }
      break;

    case "manage_users":
    case "delete_users":
      if (!canManageUsers(currentUser.role as Role)) {
        throw new ConvexError("Only admins can manage users");
      }
      break;

    case "view_users":
      if (!canViewUsers(currentUser.role as Role)) {
        throw new ConvexError("Insufficient permissions to view users");
      }
      break;

    default:
      throw new ConvexError(`Unknown action: ${action}`);
  }

  return currentUser;
};

// Initialize default permissions (to be called once during setup)
export const initializeDefaultPermissions = async (ctx: any) => {
  const permissions = [
    // Admin permissions
    {
      role: "admin",
      action: "create_content",
      resource: "content",
      allowed: true,
    },
    {
      role: "admin",
      action: "update_content",
      resource: "content",
      allowed: true,
    },
    {
      role: "admin",
      action: "delete_content",
      resource: "content",
      allowed: true,
    },
    { role: "admin", action: "manage_users", resource: "users", allowed: true },
    { role: "admin", action: "view_users", resource: "users", allowed: true },
    { role: "admin", action: "delete_users", resource: "users", allowed: true },

    // Manager permissions
    {
      role: "manager",
      action: "create_content",
      resource: "content",
      allowed: true,
    },
    {
      role: "manager",
      action: "update_content",
      resource: "content",
      allowed: true,
    },
    {
      role: "manager",
      action: "delete_content",
      resource: "content",
      allowed: true,
    },
    { role: "manager", action: "view_users", resource: "users", allowed: true },
    {
      role: "manager",
      action: "manage_users",
      resource: "users",
      allowed: false,
    },

    // User permissions
    {
      role: "user",
      action: "create_content",
      resource: "content",
      allowed: false,
    },
    {
      role: "user",
      action: "update_content",
      resource: "content",
      allowed: false,
    },
    {
      role: "user",
      action: "delete_content",
      resource: "content",
      allowed: false,
    },
    { role: "user", action: "view_users", resource: "users", allowed: false },
    { role: "user", action: "manage_users", resource: "users", allowed: false },
  ];

  for (const permission of permissions) {
    const existing = await ctx.db
      .query("rolePermissions")
      .withIndex("by_role_action", (q) =>
        q.eq("role", permission.role).eq("action", permission.action)
      )
      .first();

    if (!existing) {
      await ctx.db.insert("rolePermissions", {
        ...permission,
        createdAt: Date.now(),
      });
    }
  }
};
