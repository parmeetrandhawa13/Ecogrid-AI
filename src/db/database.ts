import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

export interface DbStatus {
  connected: boolean;
  type: 'postgres' | 'filesystem';
  error?: string;
}

let pool: pg.Pool | null = null;
const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_FILE = path.join(DATA_DIR, 'ecogrid_db.json');

// Ensure storage directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    // Ignore directory creation failure
  }
}

/**
 * Initialize PostgreSQL connection pool or filesystem persistent store
 */
export async function initDatabase(): Promise<DbStatus> {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    try {
      pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' && !connectionString.includes('localhost')
          ? { rejectUnauthorized: false }
          : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      });

      // Test connection
      const client = await pool.connect();
      try {
        // Run migration statements
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(64) PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            organization VARCHAR(255) DEFAULT 'Renewable Systems Engineering',
            role VARCHAR(64) NOT NULL DEFAULT 'Lead Renewable Architect',
            password_hash VARCHAR(255) NOT NULL,
            salt VARCHAR(64) NOT NULL,
            token VARCHAR(255),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS projects (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            location_name VARCHAR(255) NOT NULL,
            country VARCHAR(128) NOT NULL,
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL,
            overall_score SMALLINT NOT NULL,
            recommended_tech VARCHAR(32) NOT NULL,
            annual_mwh DOUBLE PRECISION NOT NULL,
            lcoe_per_mwh DOUBLE PRECISION NOT NULL,
            dashboard_data JSONB NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);
        return { connected: true, type: 'postgres' };
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.warn('[Database] PostgreSQL connection unavailable, switching to local persistent filesystem:', err.message);
      pool = null;
    }
  }

  // Filesystem initialization
  if (!fs.existsSync(BACKUP_FILE)) {
    const initialData = {
      projects: [
        {
          id: 'proj-mojave',
          name: 'Mojave Desert Mega Solar PV',
          locationName: 'Mojave Desert Solar Zone',
          country: 'United States',
          lat: 35.011,
          lng: -115.473,
          overallScore: 91,
          recommendedTech: 'Solar PV',
          annualMwh: 2420,
          lcoePerMwh: 34.5,
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
        },
        {
          id: 'proj-tehachapi',
          name: 'Tehachapi Wind Expansion Ph. 2',
          locationName: 'Tehachapi Pass Wind Corridor',
          country: 'United States',
          lat: 35.132,
          lng: -118.448,
          overallScore: 88,
          recommendedTech: 'Wind Turbine',
          annualMwh: 7650,
          lcoePerMwh: 41.2,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ],
      users: [
        {
          id: 'usr-engineer',
          email: 'engineer@ecogrid.ai',
          name: 'Alex Mercer, PE',
          organization: 'Grid Dynamics Energy',
          role: 'Lead Renewable Architect',
          password_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // 'password'
          salt: 'salt123',
          token: 'session-lead-architect-token'
        }
      ]
    };
    try {
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    } catch (e) {}
  }

  return { connected: true, type: 'filesystem' };
}

export function getDbPool(): pg.Pool | null {
  return pool;
}

export function readFsData(): { projects: any[]; users: any[] } {
  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const content = fs.readFileSync(BACKUP_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed reading filesystem DB:', err);
  }
  return { projects: [], users: [] };
}

export function writeFsData(data: { projects: any[]; users: any[] }): void {
  try {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed writing filesystem DB:', err);
  }
}
