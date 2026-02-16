/**
 * User Role Service Unit Tests
 * 
 * This test file demonstrates unit testing with mocked database connections.
 * It shows how to test business logic without requiring a live database connection.
 * 
 * Note: This test uses Jest with ES modules. The database module is mocked
 * to demonstrate testing without a live database connection.
 */

import { jest } from '@jest/globals';

// Mock the database module
const mockQuery = jest.fn();
jest.unstable_mockModule('../config/database.js', () => ({
  query: mockQuery,
  default: {}
}));

// Import the service after mocking
const { getAllUserRoles, getUserRoleByCode, getUserRoleById } = await import('../services/userRoleService.js');

describe('UserRoleService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    mockQuery.mockClear();
  });

  describe('getAllUserRoles', () => {
    it('should return all user roles', async () => {
      // Arrange: Mock database response
      const mockRoles = [
        { id: 1, role_code: 'DESIGNER', description: 'Designer/Contributor', created_at: '2026-01-01' },
        { id: 2, role_code: 'REVIEWER', description: 'Creative Reviewer', created_at: '2026-01-01' },
        { id: 3, role_code: 'ADMIN', description: 'Admin/Project Owner', created_at: '2026-01-01' }
      ];
      
      mockQuery.mockResolvedValue({ rows: mockRoles });

      // Act: Call the service function
      const result = await getAllUserRoles();

      // Assert: Verify the result
      expect(result).toEqual(mockRoles);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT id, role_code, description, created_at FROM user_roles ORDER BY id'
      );
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw error when database query fails', async () => {
      // Arrange: Mock database error
      const mockError = new Error('Database connection failed');
      mockQuery.mockRejectedValue(mockError);

      // Act & Assert: Verify error is thrown
      await expect(getAllUserRoles()).rejects.toThrow('Failed to fetch user roles');
    });
  });

  describe('getUserRoleByCode', () => {
    it('should return user role for valid code', async () => {
      // Arrange
      const mockRole = { id: 1, role_code: 'DESIGNER', description: 'Designer/Contributor' };
      mockQuery.mockResolvedValue({ rows: [mockRole] });

      // Act
      const result = await getUserRoleByCode('DESIGNER');

      // Assert
      expect(result).toEqual(mockRole);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT id, role_code, description, created_at FROM user_roles WHERE role_code = $1',
        ['DESIGNER']
      );
    });

    it('should return null for non-existent role code', async () => {
      // Arrange
      mockQuery.mockResolvedValue({ rows: [] });

      // Act
      const result = await getUserRoleByCode('INVALID');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getUserRoleById', () => {
    it('should return user role for valid ID', async () => {
      // Arrange
      const mockRole = { id: 2, role_code: 'REVIEWER', description: 'Creative Reviewer' };
      mockQuery.mockResolvedValue({ rows: [mockRole] });

      // Act
      const result = await getUserRoleById(2);

      // Assert
      expect(result).toEqual(mockRole);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT id, role_code, description, created_at FROM user_roles WHERE id = $1',
        [2]
      );
    });
  });
});
