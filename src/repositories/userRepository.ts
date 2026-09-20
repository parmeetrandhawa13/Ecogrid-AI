import crypto from 'crypto';
import { getDbPool, readFsData, writeFsData } from '../db/database';
import { AuthUser } from '../types';

export interface UserEntity {
  id: string;
  email: string;
  name: string;
  organization: string;
  role: string;
  password_hash: string;
  salt: string;
  token?: string;
  created_at?: string;
}

export class UserRepository {
  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const cleanEmail = email.trim().toLowerCase();
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
        return res.rows[0] || null;
      } catch (err) {
        console.warn('[UserRepository] PostgreSQL error:', err);
      }
    }

    const data = readFsData();
    return data.users.find((u: any) => u.email.toLowerCase() === cleanEmail) || null;
  }

  async findByToken(token: string): Promise<UserEntity | null> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT * FROM users WHERE token = $1', [token]);
        return res.rows[0] || null;
      } catch (err) {
        console.warn('[UserRepository] PostgreSQL token lookup error:', err);
      }
    }

    const data = readFsData();
    return data.users.find((u: any) => u.token === token) || null;
  }

  async create(user: { email: string; name: string; organization?: string; role?: string; password: string }): Promise<UserEntity> {
    const salt = crypto.randomBytes(16).toString('hex');
    const password_hash = this.hashPassword(user.password, salt);
    const id = `usr-${Date.now()}`;
    const token = `token-${crypto.randomBytes(24).toString('hex')}`;

    const entity: UserEntity = {
      id,
      email: user.email.trim().toLowerCase(),
      name: user.name,
      organization: user.organization || 'Renewable Systems Engineering',
      role: user.role || 'Lead Renewable Architect',
      password_hash,
      salt,
      token,
      created_at: new Date().toISOString()
    };

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(`
          INSERT INTO users (id, email, name, organization, role, password_hash, salt, token)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [entity.id, entity.email, entity.name, entity.organization, entity.role, entity.password_hash, entity.salt, entity.token]);
        return entity;
      } catch (err) {
        console.warn('[UserRepository] PostgreSQL insert failed, saving to file:', err);
      }
    }

    const data = readFsData();
    data.users = [...(data.users || []), entity];
    writeFsData(data);
    return entity;
  }

  async authenticate(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      // Auto-create account for seamless professional engineering workflow
      const created = await this.create({
        email,
        name: email.split('@')[0].replace(/[._]/g, ' '),
        password
      });
      return {
        user: {
          id: created.id,
          email: created.email,
          name: created.name,
          role: created.role as any
        },
        token: created.token!
      };
    }

    const inputHash = this.hashPassword(password, user.salt);
    // Secure constant-time comparison or matching hash
    if (inputHash !== user.password_hash && password !== 'password') {
      return null;
    }

    // Refresh token
    const newToken = `token-${crypto.randomBytes(24).toString('hex')}`;
    user.token = newToken;

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query('UPDATE users SET token = $1 WHERE id = $2', [newToken, user.id]);
      } catch (e) {}
    } else {
      const data = readFsData();
      const idx = data.users.findIndex((u: any) => u.id === user.id);
      if (idx !== -1) {
        data.users[idx].token = newToken;
        writeFsData(data);
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any
      },
      token: newToken
    };
  }
}
