/**
 * CloudBase 数据库服务
 * 使用 HTTP API 操作 NoSQL 数据库
 */

import CLOUDBASE_CONFIG, { CLOUDBASE_API_BASE } from '@/config/cloudbaseConfig';

interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

class CloudBaseDatabase {
  private env: string;
  private accessToken: string | null = null;

  constructor() {
    this.env = CLOUDBASE_CONFIG.env;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async request(collection: string, data: Record<string, any>) {
    const response = await fetch(`${CLOUDBASE_API_BASE}/database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken || CLOUDBASE_CONFIG.accessKey}`,
      },
      body: JSON.stringify({
        env: this.env,
        ...data,
      }),
    });

    const result = await response.json();
    if (result.code && result.code !== 0) {
      throw new Error(result.message || '数据库操作失败');
    }
    return result;
  }

  async add(collection: string, data: Record<string, any>): Promise<string> {
    const result = await this.request(collection, {
      action: 'database.add',
      collection,
      data: {
        ...data,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      },
    });
    return result.id || result.data?.id;
  }

  async get(collection: string, id: string): Promise<Record<string, any> | null> {
    const result = await this.request(collection, {
      action: 'database.get',
      collection,
      id,
    });
    return result.data || null;
  }

  async query(
    collection: string,
    query: Record<string, any> = {},
    options: QueryOptions = {}
  ): Promise<Record<string, any>[]> {
    const result = await this.request(collection, {
      action: 'database.query',
      collection,
      query,
      ...options,
    });
    return result.data || [];
  }

  async update(collection: string, id: string, data: Record<string, any>): Promise<void> {
    await this.request(collection, {
      action: 'database.update',
      collection,
      id,
      data: {
        ...data,
        _updatedAt: new Date().toISOString(),
      },
    });
  }

  async delete(collection: string, id: string): Promise<void> {
    await this.request(collection, {
      action: 'database.delete',
      collection,
      id,
    });
  }

  async count(collection: string, query: Record<string, any> = {}): Promise<number> {
    const result = await this.request(collection, {
      action: 'database.count',
      collection,
      query,
    });
    return result.count || 0;
  }
}

export const db = new CloudBaseDatabase();
export default db;
