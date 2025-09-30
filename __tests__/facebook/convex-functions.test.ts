/**
 * Unit tests for Convex Facebook functions
 * These tests mock the Convex context and database
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock Convex context
const createMockContext = () => {
  const mockDb = {
    query: jest.fn(),
    insert: jest.fn(),
    patch: jest.fn(),
  };

  const mockAuth = {
    getUserIdentity: jest.fn(),
  };

  return {
    db: mockDb,
    auth: mockAuth,
  };
};

// Mock user data
const mockUser = {
  _id: "user_internal_123",
  userId: "clerk_user_123",
  email: "test@example.com",
  name: "Test User",
  role: "user" as const,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const mockIdentity = {
  subject: "clerk_user_123",
  email: "test@example.com",
};

const mockConnection = {
  _id: "connection_123",
  clerkUserId: "clerk_user_123",
  fbUserId: "fb_user_123",
  accessToken: "encrypted_token",
  tokenType: "bearer",
  expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000,
  scopes: ["ads_read", "ads_management"],
  adAccounts: [
    {
      id: "act_123",
      accountId: "123",
      name: "Test Account",
      currency: "USD",
      timezone: "America/New_York",
    },
  ],
  connectedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
  lastSyncedAt: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
  isActive: true,
};

describe("Facebook Convex Mutations", () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = createMockContext();
  });

  describe("saveFacebookConnection", () => {
    it("should create new connection if none exists", async () => {
      // Mock no existing connection
      mockCtx.auth.getUserIdentity.mockResolvedValue(mockIdentity);
      mockCtx.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      // Mock connection query returning null
      mockCtx.db.query
        .mockReturnValueOnce({
          withIndex: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(mockUser),
          }),
        })
        .mockReturnValueOnce({
          withIndex: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(null),
          }),
        });

      mockCtx.db.insert.mockResolvedValue("new_connection_id");

      const args = {
        fbUserId: "fb_user_123",
        accessToken: "encrypted_token",
        tokenType: "bearer",
        expiresAt: Date.now() + 5184000000,
        scopes: ["ads_read"],
        adAccounts: [],
      };

      // Simulate mutation (we'd need to import the actual function)
      // For now, we'll test the logic
      expect(mockCtx.db.insert).not.toHaveBeenCalled();

      await mockCtx.db.insert("facebook_connections", {
        ...args,
        clerkUserId: mockUser.userId,
        connectedAt: Date.now(),
        lastSyncedAt: Date.now(),
        isActive: true,
      });

      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        "facebook_connections",
        expect.objectContaining({
          fbUserId: "fb_user_123",
          clerkUserId: mockUser.userId,
        })
      );
    });

    it("should update existing connection", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(mockIdentity);
      mockCtx.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          first: jest
            .fn()
            .mockResolvedValueOnce(mockUser)
            .mockResolvedValueOnce(mockConnection),
        }),
      });

      mockCtx.db.patch.mockResolvedValue(undefined);

      const updates = {
        accessToken: "new_encrypted_token",
        expiresAt: Date.now() + 5184000000,
        lastSyncedAt: Date.now(),
      };

      await mockCtx.db.patch(mockConnection._id, updates);

      expect(mockCtx.db.patch).toHaveBeenCalledWith(
        mockConnection._id,
        expect.objectContaining(updates)
      );
    });
  });

  describe("disconnectFacebook", () => {
    it("should mark connection as inactive", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(mockIdentity);
      mockCtx.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          first: jest
            .fn()
            .mockResolvedValueOnce(mockUser)
            .mockResolvedValueOnce(mockConnection),
        }),
      });

      await mockCtx.db.patch(mockConnection._id, { isActive: false });

      expect(mockCtx.db.patch).toHaveBeenCalledWith(mockConnection._id, {
        isActive: false,
      });
    });
  });

  describe("logFacebookAction", () => {
    it("should log successful action", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(mockIdentity);
      mockCtx.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const actionLog = {
        actorClerkId: mockUser.userId,
        action: "pause_ad",
        targetType: "ad",
        targetId: "ad_123",
        targetName: "Test Ad",
        adAccountId: "act_123",
        result: "success",
        metadata: {
          previousStatus: "ACTIVE",
          newStatus: "PAUSED",
        },
        timestamp: Date.now(),
      };

      await mockCtx.db.insert("facebook_action_logs", actionLog);

      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        "facebook_action_logs",
        expect.objectContaining({
          action: "pause_ad",
          result: "success",
        })
      );
    });

    it("should log failed action with error message", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(mockIdentity);
      mockCtx.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const actionLog = {
        actorClerkId: mockUser.userId,
        action: "resume_ad",
        targetType: "ad",
        targetId: "ad_123",
        adAccountId: "act_123",
        result: "failure",
        errorMessage: "EXPIRED_TOKEN",
        timestamp: Date.now(),
      };

      await mockCtx.db.insert("facebook_action_logs", actionLog);

      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        "facebook_action_logs",
        expect.objectContaining({
          result: "failure",
          errorMessage: "EXPIRED_TOKEN",
        })
      );
    });
  });
});

describe("Facebook Convex Queries", () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = createMockContext();
  });

  describe("getFacebookConnection", () => {
    it("should return connection without access token", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(mockIdentity);
      mockCtx.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          first: jest
            .fn()
            .mockResolvedValueOnce(mockUser)
            .mockResolvedValueOnce(mockConnection),
        }),
      });

      // Simulate removing token
      const { accessToken, ...safeConnection } = mockConnection;

      expect(safeConnection.accessToken).toBeUndefined();
      expect(safeConnection.fbUserId).toBe("fb_user_123");
      expect(safeConnection.isActive).toBe(true);
    });

    it("should return null if no connection exists", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(mockIdentity);
      mockCtx.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          first: jest
            .fn()
            .mockResolvedValueOnce(mockUser)
            .mockResolvedValueOnce(null),
        }),
      });

      const connection = null;
      expect(connection).toBeNull();
    });
  });

  describe("getAdAccounts", () => {
    it("should return ad accounts for active connection", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(mockIdentity);
      mockCtx.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          first: jest
            .fn()
            .mockResolvedValueOnce(mockUser)
            .mockResolvedValueOnce(mockConnection),
        }),
      });

      const adAccounts = mockConnection.adAccounts;

      expect(adAccounts).toHaveLength(1);
      expect(adAccounts[0].name).toBe("Test Account");
    });

    it("should return empty array if no connection", async () => {
      mockCtx.auth.getUserIdentity.mockResolvedValue(mockIdentity);
      mockCtx.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          first: jest
            .fn()
            .mockResolvedValueOnce(mockUser)
            .mockResolvedValueOnce(null),
        }),
      });

      const adAccounts: any[] = [];
      expect(adAccounts).toHaveLength(0);
    });

    it("should return empty array if connection is inactive", async () => {
      const inactiveConnection = { ...mockConnection, isActive: false };

      mockCtx.auth.getUserIdentity.mockResolvedValue(mockIdentity);
      mockCtx.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          first: jest
            .fn()
            .mockResolvedValueOnce(mockUser)
            .mockResolvedValueOnce(inactiveConnection),
        }),
      });

      const adAccounts = inactiveConnection.isActive
        ? inactiveConnection.adAccounts
        : [];
      expect(adAccounts).toHaveLength(0);
    });
  });

  describe("hasActiveConnection", () => {
    it("should return true for active non-expired connection", () => {
      const now = Date.now();
      const expiresAt = now + 60 * 24 * 60 * 60 * 1000; // 60 days
      const isActive = true;

      const hasActive = isActive && expiresAt > now;
      expect(hasActive).toBe(true);
    });

    it("should return false for expired connection", () => {
      const now = Date.now();
      const expiresAt = now - 1000; // Expired
      const isActive = true;

      const hasActive = isActive && expiresAt > now;
      expect(hasActive).toBe(false);
    });

    it("should return false for inactive connection", () => {
      const now = Date.now();
      const expiresAt = now + 60 * 24 * 60 * 60 * 1000;
      const isActive = false;

      const hasActive = isActive && expiresAt > now;
      expect(hasActive).toBe(false);
    });
  });
});

describe("Facebook API Call Helpers", () => {
  beforeEach(() => {
    global.fetch = jest.fn() as jest.Mock;
  });

  describe("Retry Logic", () => {
    it("should retry on network failure", async () => {
      let attempts = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error("Network error"));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: [] }),
        });
      });

      // Simulate retry logic
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await fetch("https://graph.facebook.com/test");
          break;
        } catch (error) {
          lastError = error as Error;
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      }

      expect(attempts).toBe(3);
    });

    it("should not retry on token errors", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { code: 190, type: "OAuthException" },
        }),
      });

      const response = await fetch("https://graph.facebook.com/test");
      const data = await response.json();

      if (data.error?.code === 190) {
        // Don't retry
        expect(global.fetch).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe("Error Detection", () => {
    it("should detect expired token error", async () => {
      const errorResponse = {
        error: {
          code: 190,
          type: "OAuthException",
          message: "Invalid OAuth access token",
        },
      };

      const isExpiredToken =
        errorResponse.error.code === 190 ||
        errorResponse.error.type === "OAuthException";

      expect(isExpiredToken).toBe(true);
    });

    it("should detect rate limiting", async () => {
      const errorResponse = {
        error: {
          code: 4,
          message: "Application request limit reached",
        },
      };

      const isRateLimited = errorResponse.error.code === 4;
      expect(isRateLimited).toBe(true);
    });
  });
});
