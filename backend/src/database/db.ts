import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(__dirname, '../../../data/maturity-model.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database with tables
export const initializeDatabase = async () => {
  console.log('Initializing database...');
  
  // Create tables
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Teams table
    db.run(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        owner_id INTEGER NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users (id)
      )
    `);

    // Services table
    db.run(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        owner_id INTEGER NOT NULL,
        team_id INTEGER NOT NULL,
        description TEXT,
        service_type TEXT NOT NULL,
        resource_location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users (id),
        FOREIGN KEY (team_id) REFERENCES teams (id)
      )
    `);

    // Maturity Models table
    db.run(`
      CREATE TABLE IF NOT EXISTS maturity_models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        owner_id INTEGER NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users (id)
      )
    `);

    // Measurement Categories table
    db.run(`
      CREATE TABLE IF NOT EXISTS measurement_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Measurements table
    db.run(`
      CREATE TABLE IF NOT EXISTS measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        maturity_model_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        description TEXT,
        evidence_type TEXT NOT NULL,
        sample_evidence TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (maturity_model_id) REFERENCES maturity_models (id),
        FOREIGN KEY (category_id) REFERENCES measurement_categories (id)
      )
    `);

    // Campaigns table
    db.run(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        maturity_model_id INTEGER NOT NULL,
        start_date DATETIME,
        end_date DATETIME,
        status TEXT NOT NULL,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (maturity_model_id) REFERENCES maturity_models (id),
        FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `);

    // Campaign Participants table
    db.run(`
      CREATE TABLE IF NOT EXISTS campaign_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns (id),
        FOREIGN KEY (service_id) REFERENCES services (id)
      )
    `);

    // Measurement Evaluations table
    db.run(`
      CREATE TABLE IF NOT EXISTS measurement_evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        measurement_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        evidence_location TEXT,
        notes TEXT,
        evaluated_by INTEGER,
        evaluated_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns (id),
        FOREIGN KEY (service_id) REFERENCES services (id),
        FOREIGN KEY (measurement_id) REFERENCES measurements (id),
        FOREIGN KEY (evaluated_by) REFERENCES users (id)
      )
    `);

    // Evaluation History table
    db.run(`
      CREATE TABLE IF NOT EXISTS evaluation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        evaluation_id INTEGER NOT NULL,
        previous_status TEXT NOT NULL,
        new_status TEXT NOT NULL,
        changed_by INTEGER NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (evaluation_id) REFERENCES measurement_evaluations (id),
        FOREIGN KEY (changed_by) REFERENCES users (id)
      )
    `);

    // Maturity Level Rules table
    db.run(`
      CREATE TABLE IF NOT EXISTS maturity_level_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        maturity_model_id INTEGER NOT NULL,
        level INTEGER NOT NULL,
        min_percentage REAL NOT NULL,
        max_percentage REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (maturity_model_id) REFERENCES maturity_models (id)
      )
    `);

    console.log('Database tables created successfully');
  });
};

// Close database connection when the application is terminated
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});