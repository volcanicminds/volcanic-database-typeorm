/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataSource, EntityManager } from 'typeorm'
import { Tenant } from '../entities/tenant.js'

export class TenantManager {
  constructor(private dataSource: DataSource) {}

  isImplemented() {
    return true
  }

  async resolveTenant(req: any): Promise<Tenant | null> {
    const { multi_tenant } = (global as any).config?.options || {}
    
    // 1. Single Tenant Mode (Default)
    if (!multi_tenant?.enabled) {
      return null
    }

    // 2. Multi-Tenant Mode: Extract Identifiers
    // Parse JWT from headers if not already attached (Fastify might attach it to req.user)
    const jwtTid = req.user?.tid
    const headerTid = req.headers['x-tenant-id']

    // 3. Validation Logic (Strict)
    // Rule A: Header is MANDATORY in Multi-Tenant
    if (!headerTid) {
       throw new Error('Multi-Tenancy Error: Missing x-tenant-id header')
    }

    // Rule B: JWT is OPTIONAL (For Public Routes/Login)
    // If JWT is missing, we trust the Header (Auth Guard will block Protected Routes later if Token is missing)
    // if (!jwtTid) { ... } // REMOVED STRICT CHECK

    // Rule C: Must Match (Security against Spoofing)
    // If a user IS authenticated, they MUST allow match the requested tenant header.
    if (jwtTid && headerTid) {
         if (jwtTid !== headerTid) {
             throw new Error('Security Alert: JWT Tenant ID mismatch with Header Tenant ID')
         }
    }

    const tenantId = headerTid || jwtTid

    // 4. If no identifier found, return null (404 handled by caller)
    if (!tenantId) {
      if ((global as any).log?.d) (global as any).log.debug('[TenantManager] No tenant ID found in request')
      return null
    }

    // 5. Database Lookup
    // We must use the specific 'Tenant' entity which extends BaseEntity
    // Assuming the user has registered a class named 'Tenant' in entities
    const tenantRepo = this.dataSource.getRepository(Tenant)
    const tenant = await tenantRepo.findOne({ where: { id: tenantId } })
    
    if (!tenant) {
      if ((global as any).log?.w) (global as any).log.warn(`[TenantManager] Tenant ${tenantId} not found in DB`)
      return null
    }

    // 6. Access Control (Optional but recommended)
    // Verify if the authenticated user (req.user) belongs to this tenant
    // This logic might depend on the specific 'User' entity structure, so we keep it basic for the library
    
    return tenant
  }

  async switchContext(tenant: Tenant, db?: EntityManager) {
    const driver = this.dataSource.driver.options.type

    if (driver === 'postgres') {
      const schema = tenant.dbSchema || 'public'
      const safeSchema = schema.replace(/[^a-z0-9_]/gi, '')

      if (db) {
        if ((global as any).log?.t) (global as any).log.trace(`[TenantManager] Context-Aware Switch Schema to: ${safeSchema}`)
        await db.query(`SET search_path TO "${safeSchema}", public`)
      } else {
        if ((global as any).log?.w) (global as any).log.warn('[TenantManager] ⚠️ Switching Global Connection Pool Context! Use generic .use(req.db) pattern instead.')
        await this.dataSource.query(`SET search_path TO "${safeSchema}", public`)
      }

    } else if (driver === 'mongodb') {
       // FIXME: Mongo Multi-Tenancy isolation is incomplete
       if ((global as any).log?.w) (global as any).log.warn('[TenantManager] Mongo Multi-Tenancy context switch is not enforcing isolation yet.')
    }
  }

  async createTenant(data: any): Promise<void> {
    const driver = this.dataSource.driver.options.type

    if (driver === 'postgres') {
      const schema = data.dbSchema
      if (!schema) throw new Error('dbSchema is required for Postgres Multi-Tenancy')
      
      const safeSchema = schema.replace(/[^a-z0-9_]/gi, '')
      await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${safeSchema}"`)
      if ((global as any).log?.i) (global as any).log.info(`[TenantManager] Created Schema: ${safeSchema}`)
      
    } else {
      throw new Error(`createTenant not implemented for driver: ${driver}`)
    }
  }

  async deleteTenant(_id: string): Promise<void> {
    // TODO: Retrieve tenant schema by ID and implement safe drop logic
    throw new Error('deleteTenant requires full implementation with Safety Checks (Drop Schema is dangerous)')
  }
}
