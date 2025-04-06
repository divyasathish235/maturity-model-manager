import { db } from '../database/db';

export class DatabaseService {
  /**
   * Execute a SQL query with parameters and return the result
   * @param sql SQL query
   * @param params Parameters for the query
   * @returns Promise with the query result
   */
  static async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Database query error:', err);
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  /**
   * Execute a SQL query that returns a single row
   * @param sql SQL query
   * @param params Parameters for the query
   * @returns Promise with the query result
   */
  static async get<T>(sql: string, params: any[] = []): Promise<T | null> {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          console.error('Database get error:', err);
          reject(err);
        } else {
          resolve(row as T || null);
        }
      });
    });
  }

  /**
   * Execute a SQL query that doesn't return any rows
   * @param sql SQL query
   * @param params Parameters for the query
   * @returns Promise with the last inserted ID
   */
  static async run(sql: string, params: any[] = []): Promise<number> {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          console.error('Database run error:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Begin a transaction
   * @returns Promise
   */
  static async beginTransaction(): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          console.error('Begin transaction error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Commit a transaction
   * @returns Promise
   */
  static async commitTransaction(): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) {
          console.error('Commit transaction error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Rollback a transaction
   * @returns Promise
   */
  static async rollbackTransaction(): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('ROLLBACK', (err) => {
        if (err) {
          console.error('Rollback transaction error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}