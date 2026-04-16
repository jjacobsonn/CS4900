/**
 * User service tests for Sprint 3 account provisioning and password lifecycle.
 *
 * These mock the database but use real bcrypt hashing so we can verify passwords
 * are never persisted as plaintext.
 */

import { jest } from "@jest/globals";
import bcrypt from "bcrypt";

const mockQuery = jest.fn();

jest.unstable_mockModule("../config/database.js", () => ({
  query: mockQuery,
  default: {}
}));

const { createUserAccount, patchUserById } = await import("../services/userService.js");

describe("userService password lifecycle", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  test("createUserAccount hashes a provided password before persistence", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // ensure OWNER
      .mockResolvedValueOnce({ rows: [] }) // ensure MANAGER
      .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // role lookup
      .mockResolvedValueOnce({
        rows: [
          {
            id: 44,
            email: "designer@example.com",
            display_name: "Demo Designer",
            is_active: true
          }
        ]
      });

    const created = await createUserAccount({
      email: "designer@example.com",
      role: "designer",
      displayName: "Demo Designer",
      password: "TestPass123!"
    });

    expect(created).toEqual({
      id: "44",
      email: "designer@example.com",
      displayName: "Demo Designer",
      role: "designer",
      isActive: true
    });

    const insertArgs = mockQuery.mock.calls[3][1];
    const persistedHash = insertArgs[1];

    expect(persistedHash).not.toBe("TestPass123!");
    expect(await bcrypt.compare("TestPass123!", persistedHash)).toBe(true);
  });

  test("createUserAccount rejects short provided passwords", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] });

    await expect(
      createUserAccount({
        email: "designer@example.com",
        role: "designer",
        password: "abc"
      })
    ).rejects.toThrow("Password must be at least 4 characters.");

    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  test("patchUserById hashes reset password and returns refreshed user", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // ensure OWNER
      .mockResolvedValueOnce({ rows: [] }) // ensure MANAGER
      .mockResolvedValueOnce({
        rows: [
          {
            id: 55,
            email: "reviewer@example.com",
            display_name: "Reviewer",
            is_active: true,
            role: "reviewer"
          }
        ]
      }) // get existing user
      .mockResolvedValueOnce({ rows: [{ id: 55 }] }) // password update
      .mockResolvedValueOnce({
        rows: [
          {
            id: 55,
            email: "reviewer@example.com",
            display_name: "Reviewer",
            is_active: true,
            role: "reviewer"
          }
        ]
      }); // refreshed user

    const updated = await patchUserById(55, { password: "NewPass123!" });

    const updateArgs = mockQuery.mock.calls[3][1];
    const persistedHash = updateArgs[0];

    expect(updated.email).toBe("reviewer@example.com");
    expect(persistedHash).not.toBe("NewPass123!");
    expect(await bcrypt.compare("NewPass123!", persistedHash)).toBe(true);
  });
});
