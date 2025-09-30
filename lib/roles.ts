"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export type Role = "admin" | "manager" | "user";

export function useRole(): Role {
  const { user } = useUser();

  // Check if we have a valid Convex environment
  const hasValidConvex = Boolean(
    process.env.NEXT_PUBLIC_CONVEX_URL &&
      !process.env.NEXT_PUBLIC_CONVEX_URL.includes("placeholder") &&
      process.env.NEXT_PUBLIC_CONVEX_URL.startsWith("https://")
  );

  // Always call hooks but skip execution if Convex is not available
  const convexUser = useQuery(
    api.users.getByUserId,
    hasValidConvex && user ? { userId: user.id } : "skip"
  );
  const syncUser = useMutation(api.sync.syncUser);

  // Auto-sync user to Convex if they don't exist there
  useEffect(() => {
    if (hasValidConvex && user && convexUser === null) {
      // User exists in Clerk but not in Convex, sync them
      const name =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`.trim()
          : user.firstName ||
            user.lastName ||
            user.emailAddresses[0]?.emailAddress.split("@")[0] ||
            "Unknown";

      const email = user.emailAddresses[0]?.emailAddress || "";
      // Default role is "user" - no longer from Clerk metadata
      const role: Role = "user";

      syncUser({
        userId: user.id,
        name,
        email,
        role,
      });
    }
  }, [hasValidConvex, user, convexUser, syncUser]);

  if (!user) {
    return "user";
  }

  // Get role exclusively from Convex database
  if (convexUser) {
    return convexUser.role as Role;
  }

  // Default to user role while data loads (no Clerk fallback)
  return "user";
}

// Role hierarchy for permission checking
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

// Core permission functions
export const canManageContent = (role: Role) =>
  hasHigherOrEqualRole(role, "manager");
export const canManageUsers = (role: Role) => role === "admin";
export const canViewUsers = (role: Role) =>
  hasHigherOrEqualRole(role, "manager");
export const isAdmin = (role: Role) => role === "admin";
export const isManager = (role: Role) => role === "manager";

// Backwards-compatible helpers used by existing components
export const canCreateResources = (role: Role) => canManageContent(role);
export const canDeleteResources = (role: Role) => canManageContent(role);
export const canAddKpi = (role: Role) => canManageContent(role);

// New content-specific helpers
export const canCreateContent = (role: Role) => canManageContent(role);
export const canDeleteContent = (role: Role) => canManageContent(role);

// User management permissions
export const canPromoteToAdmin = (role: Role) => isAdmin(role);
export const canPromoteToManager = (role: Role) => isAdmin(role);
export const canDemoteUser = (role: Role) => isAdmin(role);
export const canDeleteUsers = (role: Role) => isAdmin(role);

// Hook to get current user's Convex profile
export function useCurrentUser() {
  const { user } = useUser();

  // Check if we have a valid Convex environment
  const hasValidConvex = Boolean(
    process.env.NEXT_PUBLIC_CONVEX_URL &&
      !process.env.NEXT_PUBLIC_CONVEX_URL.includes("placeholder") &&
      process.env.NEXT_PUBLIC_CONVEX_URL.startsWith("https://")
  );

  return useQuery(
    api.users.queries.getCurrentUserProfile,
    hasValidConvex && user ? {} : "skip"
  );
}

// Hook to check if current user can perform an action
export function useCanPerformAction(action: string, targetUserId?: string) {
  const { user } = useUser();

  // Check if we have a valid Convex environment
  const hasValidConvex = Boolean(
    process.env.NEXT_PUBLIC_CONVEX_URL &&
      !process.env.NEXT_PUBLIC_CONVEX_URL.includes("placeholder") &&
      process.env.NEXT_PUBLIC_CONVEX_URL.startsWith("https://")
  );

  return useQuery(
    api.users.queries.canPerformAction,
    hasValidConvex && user ? { action, targetUserId } : "skip"
  );
}
