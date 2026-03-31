/**
 * JWT helpers — pure signing/verification; no DB or HTTP.
 */

import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import jwt from "jsonwebtoken";
import { signAuthToken, verifyAuthToken } from "../services/jwtService.js";

const savedSecret = process.env.JWT_SECRET;

describe("jwtService", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "jwt-service-unit-test-secret";
  });

  afterEach(() => {
    if (savedSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = savedSecret;
    }
  });

  test("signAuthToken then verifyAuthToken preserves sub, lowercases role, optional email", () => {
    const token = signAuthToken({ userId: "42", role: "Admin", email: "a@example.com" });
    const decoded = verifyAuthToken(token);
    expect(decoded.sub).toBe("42");
    expect(decoded.role).toBe("admin");
    expect(decoded.email).toBe("a@example.com");
  });

  test("signAuthToken omits email when not passed", () => {
    const token = signAuthToken({ userId: "7", role: "designer" });
    const decoded = verifyAuthToken(token);
    expect(decoded.sub).toBe("7");
    expect(decoded.role).toBe("designer");
    expect(decoded.email).toBeUndefined();
  });

  test("signAuthToken throws when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;
    expect(() => signAuthToken({ userId: "1", role: "designer" })).toThrow("JWT_SECRET");
  });

  test("verifyAuthToken throws on malformed token", () => {
    expect(() => verifyAuthToken("not-a-jwt")).toThrow();
  });

  test("verifyAuthToken throws when signed with a different secret", () => {
    const rogue = jwt.sign({ sub: "1", role: "admin" }, "some-other-secret", { expiresIn: "1h" });
    expect(() => verifyAuthToken(rogue)).toThrow();
  });
});
