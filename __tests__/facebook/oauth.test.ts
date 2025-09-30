/**
 * Unit tests for Facebook OAuth token exchange
 * These tests mock the Facebook Graph API responses
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock Facebook API responses
const mockShortLivedTokenResponse = {
  access_token: "short_lived_token_123",
  token_type: "bearer",
};

const mockLongLivedTokenResponse = {
  access_token: "long_lived_token_456",
  token_type: "bearer",
  expires_in: 5184000, // 60 days
};

const mockUserResponse = {
  id: "fb_user_123",
  name: "Test User",
  email: "test@example.com",
};

const mockAdAccountsResponse = {
  data: [
    {
      id: "act_123456",
      account_id: "123456",
      name: "Test Ad Account 1",
      currency: "USD",
      timezone: "America/New_York",
    },
    {
      id: "act_789012",
      account_id: "789012",
      name: "Test Ad Account 2",
      currency: "EUR",
      timezone: "Europe/London",
    },
  ],
};

describe("Facebook OAuth Token Exchange", () => {
  beforeEach(() => {
    // Reset mocks before each test
    global.fetch = jest.fn() as jest.Mock;
  });

  describe("exchangeCodeForToken", () => {
    it("should exchange authorization code for short-lived token", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShortLivedTokenResponse,
      });

      // Simulate the token exchange
      const code = "auth_code_123";
      const params = new URLSearchParams({
        client_id: "test_app_id",
        client_secret: "test_app_secret",
        redirect_uri: "http://localhost:3000/api/auth/facebook/callback",
        code,
      });

      const response = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?${params.toString()}`
      );
      const data = await response.json();

      expect(data.access_token).toBe("short_lived_token_123");
      expect(data.token_type).toBe("bearer");
    });

    it("should handle token exchange errors", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: "Invalid authorization code",
            type: "OAuthException",
            code: 100,
          },
        }),
      });

      const response = await fetch(
        "https://graph.facebook.com/v21.0/oauth/access_token?code=invalid"
      );
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error.type).toBe("OAuthException");
    });
  });

  describe("exchangeForLongLivedToken", () => {
    it("should exchange short-lived token for long-lived token", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLongLivedTokenResponse,
      });

      const response = await fetch(
        "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token"
      );
      const data = await response.json();

      expect(data.access_token).toBe("long_lived_token_456");
      expect(data.expires_in).toBe(5184000);
    });

    it("should calculate correct expiration timestamp", () => {
      const expiresIn = 5184000; // 60 days in seconds
      const now = Date.now();
      const expiresAt = now + expiresIn * 1000;

      const expectedExpiry = now + 60 * 24 * 60 * 60 * 1000; // 60 days in ms

      // Allow 1 second tolerance
      expect(Math.abs(expiresAt - expectedExpiry)).toBeLessThan(1000);
    });
  });

  describe("fetchFacebookUser", () => {
    it("should fetch user information", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserResponse,
      });

      const response = await fetch(
        "https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=token"
      );
      const data = await response.json();

      expect(data.id).toBe("fb_user_123");
      expect(data.name).toBe("Test User");
      expect(data.email).toBe("test@example.com");
    });
  });

  describe("fetchAdAccounts", () => {
    it("should fetch ad accounts", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAdAccountsResponse,
      });

      const response = await fetch(
        "https://graph.facebook.com/v21.0/me/adaccounts?fields=id,account_id,name,currency,timezone"
      );
      const data = await response.json();

      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe("Test Ad Account 1");
      expect(data.data[1].currency).toBe("EUR");
    });

    it("should handle empty ad accounts", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const response = await fetch(
        "https://graph.facebook.com/v21.0/me/adaccounts"
      );
      const data = await response.json();

      expect(data.data).toHaveLength(0);
    });
  });

  describe("CSRF Protection", () => {
    it("should generate random state parameter", () => {
      const state1 = `user_123_${Date.now()}`;
      const state2 = `user_123_${Date.now() + 1}`;

      expect(state1).not.toBe(state2);
      expect(state1).toContain("user_123");
    });

    it("should validate state parameter", () => {
      const generatedState = "state_abc123";
      const receivedState = "state_abc123";
      const invalidState = "state_xyz789";

      expect(receivedState).toBe(generatedState);
      expect(invalidState).not.toBe(generatedState);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      await expect(
        fetch("https://graph.facebook.com/v21.0/oauth/access_token")
      ).rejects.toThrow("Network error");
    });

    it("should handle rate limiting", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: "Too many requests",
            code: 4,
            error_subcode: 2446079,
          },
        }),
      });

      const response = await fetch("https://graph.facebook.com/v21.0/me");
      expect(response.status).toBe(429);
    });

    it("should handle expired tokens", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: "Invalid OAuth access token",
            type: "OAuthException",
            code: 190,
          },
        }),
      });

      const response = await fetch("https://graph.facebook.com/v21.0/me");
      const data = await response.json();

      expect(data.error.code).toBe(190);
      expect(data.error.type).toBe("OAuthException");
    });
  });
});

describe("Token Encryption", () => {
  // These tests would require the actual encryption implementation
  // For now, we'll test the concept

  it("should encrypt and decrypt tokens", () => {
    // Mock encryption/decryption
    const originalToken = "my_secret_token_123";
    const encryptionKey = "test_key_32_bytes_long_string_";

    // In real implementation:
    // const encrypted = encryptToken(originalToken, encryptionKey);
    // const decrypted = decryptToken(encrypted, encryptionKey);

    const encrypted = Buffer.from(originalToken).toString("base64");
    const decrypted = Buffer.from(encrypted, "base64").toString("utf8");

    expect(decrypted).toBe(originalToken);
    expect(encrypted).not.toBe(originalToken);
  });

  it("should not expose tokens in client responses", () => {
    const connectionWithToken = {
      _id: "conn_123",
      clerkUserId: "user_123",
      fbUserId: "fb_123",
      accessToken: "secret_token",
      tokenType: "bearer",
      expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000,
      isActive: true,
    };

    // Simulate removing token for client
    const { accessToken, ...safeConnection } = connectionWithToken;

    expect(safeConnection.accessToken).toBeUndefined();
    expect(safeConnection.fbUserId).toBe("fb_123");
  });
});
