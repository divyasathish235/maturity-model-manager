import jwt from 'jsonwebtoken';
import { UserService } from './UserService';
import { UserDTO } from '../models';

// This would typically be in an environment variable
const JWT_SECRET = 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

export class AuthService {
  /**
   * Authenticate a user and generate a JWT token
   * @param username Username
   * @param password Password
   * @returns Promise with token and user data or null if authentication fails
   */
  static async authenticate(username: string, password: string): Promise<{ token: string; user: UserDTO } | null> {
    const user = await UserService.verifyCredentials(username, password);
    
    if (!user) {
      return null;
    }
    
    const token = this.generateToken(user);
    return { token, user };
  }

  /**
   * Generate a JWT token for a user
   * @param user User data
   * @returns JWT token
   */
  static generateToken(user: UserDTO): string {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Verify a JWT token
   * @param token JWT token
   * @returns Decoded token payload or null if invalid
   */
  static verifyToken(token: string): any | null {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}