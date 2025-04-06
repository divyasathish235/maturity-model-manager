import { DatabaseService } from './DatabaseService';
import { User, UserDTO, UserRole } from '../models';
import bcrypt from 'bcrypt';

export class UserService {
  /**
   * Get all users
   * @returns Promise with array of users
   */
  static async getAllUsers(): Promise<UserDTO[]> {
    const sql = `
      SELECT id, username, email, role, created_at, updated_at
      FROM users
      ORDER BY username
    `;
    
    return DatabaseService.query<UserDTO>(sql);
  }

  /**
   * Get user by ID
   * @param id User ID
   * @returns Promise with user or null if not found
   */
  static async getUserById(id: number): Promise<UserDTO | null> {
    const sql = `
      SELECT id, username, email, role, created_at, updated_at
      FROM users
      WHERE id = ?
    `;
    
    return DatabaseService.get<UserDTO>(sql, [id]);
  }

  /**
   * Get user by username
   * @param username Username
   * @returns Promise with user or null if not found
   */
  static async getUserByUsername(username: string): Promise<User | null> {
    const sql = `
      SELECT id, username, password, email, role, created_at, updated_at
      FROM users
      WHERE username = ?
    `;
    
    return DatabaseService.get<User>(sql, [username]);
  }

  /**
   * Create a new user
   * @param user User data
   * @returns Promise with the created user ID
   */
  static async createUser(user: User): Promise<number> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    const sql = `
      INSERT INTO users (username, password, email, role)
      VALUES (?, ?, ?, ?)
    `;
    
    return DatabaseService.run(sql, [
      user.username,
      hashedPassword,
      user.email,
      user.role
    ]);
  }

  /**
   * Update a user
   * @param id User ID
   * @param user User data
   * @returns Promise with success boolean
   */
  static async updateUser(id: number, user: Partial<User>): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (user.username) {
      updates.push('username = ?');
      params.push(user.username);
    }
    
    if (user.email) {
      updates.push('email = ?');
      params.push(user.email);
    }
    
    if (user.role) {
      updates.push('role = ?');
      params.push(user.role);
    }
    
    if (user.password) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }
    
    if (updates.length === 0) {
      return false;
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const sql = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = ?
    `;
    
    await DatabaseService.run(sql, params);
    return true;
  }

  /**
   * Delete a user
   * @param id User ID
   * @returns Promise with success boolean
   */
  static async deleteUser(id: number): Promise<boolean> {
    const sql = `
      DELETE FROM users
      WHERE id = ?
    `;
    
    await DatabaseService.run(sql, [id]);
    return true;
  }

  /**
   * Verify user credentials
   * @param username Username
   * @param password Password
   * @returns Promise with user or null if invalid credentials
   */
  static async verifyCredentials(username: string, password: string): Promise<UserDTO | null> {
    const user = await this.getUserByUsername(username);
    
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    const { password: _, ...userDTO } = user;
    return userDTO as UserDTO;
  }
}