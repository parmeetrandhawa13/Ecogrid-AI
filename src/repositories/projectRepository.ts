import { FullAnalysisDashboard, SavedAnalysis } from '../types';
import { getDbPool, readFsData, writeFsData } from '../db/database';

export class ProjectRepository {
  /**
   * Fetch all saved projects
   */
  async findAll(): Promise<SavedAnalysis[]> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await pool.query(`
          SELECT id, name, location_name as "locationName", country, latitude as lat, longitude as lng,
                 overall_score as "overallScore", recommended_tech as "recommendedTech",
                 annual_mwh as "annualMwh", lcoe_per_mwh as "lcoePerMwh", dashboard_data as "dashboard",
                 created_at as "createdAt"
          FROM projects
          ORDER BY created_at DESC
        `);
        return res.rows;
      } catch (err) {
        console.warn('[ProjectRepository] Error querying PostgreSQL, falling back to FS:', err);
      }
    }

    const data = readFsData();
    return data.projects || [];
  }

  /**
   * Find project by ID
   */
  async findById(id: string): Promise<SavedAnalysis | null> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await pool.query(`
          SELECT id, name, location_name as "locationName", country, latitude as lat, longitude as lng,
                 overall_score as "overallScore", recommended_tech as "recommendedTech",
                 annual_mwh as "annualMwh", lcoe_per_mwh as "lcoePerMwh", dashboard_data as "dashboard",
                 created_at as "createdAt"
          FROM projects
          WHERE id = $1
        `, [id]);
        return res.rows[0] || null;
      } catch (err) {
        console.warn('[ProjectRepository] PostgreSQL lookup failed:', err);
      }
    }

    const data = readFsData();
    return data.projects.find((p: any) => p.id === id) || null;
  }

  /**
   * Save or update project
   */
  async save(dashboard: FullAnalysisDashboard, customName?: string): Promise<SavedAnalysis> {
    const id = `proj-${Date.now()}`;
    const name = customName || `${dashboard.location.name} ${dashboard.recommendation.recommendedTech}`;
    const createdAt = new Date().toISOString();

    const savedProject: SavedAnalysis = {
      id,
      name,
      locationName: dashboard.location.name,
      country: dashboard.location.country,
      lat: dashboard.location.lat,
      lng: dashboard.location.lng,
      overallScore: dashboard.suitability.overallScore,
      recommendedTech: dashboard.recommendation.recommendedTech,
      annualMwh: dashboard.economics.annualTotalGenerationMwh,
      lcoePerMwh: dashboard.economics.lcoePerMwh,
      dashboard,
      createdAt
    };

    const pool = getDbPool();
    if (pool) {
      try {
        await pool.query(`
          INSERT INTO projects (
            id, name, location_name, country, latitude, longitude,
            overall_score, recommended_tech, annual_mwh, lcoe_per_mwh,
            dashboard_data, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            overall_score = EXCLUDED.overall_score,
            dashboard_data = EXCLUDED.dashboard_data
        `, [
          id,
          name,
          dashboard.location.name,
          dashboard.location.country,
          dashboard.location.lat,
          dashboard.location.lng,
          dashboard.suitability.overallScore,
          dashboard.recommendation.recommendedTech,
          dashboard.economics.annualTotalGenerationMwh,
          dashboard.economics.lcoePerMwh,
          JSON.stringify(dashboard),
          createdAt
        ]);
        return savedProject;
      } catch (err) {
        console.warn('[ProjectRepository] PostgreSQL insert failed, writing to persistent filesystem:', err);
      }
    }

    const data = readFsData();
    data.projects = [savedProject, ...(data.projects || []).filter((p: any) => p.id !== id)];
    writeFsData(data);
    return savedProject;
  }

  /**
   * Delete project
   */
  async delete(id: string): Promise<boolean> {
    const pool = getDbPool();
    if (pool) {
      try {
        const res = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
        return (res.rowCount ?? 0) > 0;
      } catch (err) {
        console.warn('[ProjectRepository] PostgreSQL delete failed:', err);
      }
    }

    const data = readFsData();
    const initialLen = data.projects.length;
    data.projects = data.projects.filter((p: any) => p.id !== id);
    writeFsData(data);
    return data.projects.length < initialLen;
  }
}
