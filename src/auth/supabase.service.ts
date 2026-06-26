import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private url: string;
  private anonKey: string;
  private serviceRoleKey: string;

  constructor(private config: ConfigService) {
    this.url = this.config.get('SUPABASE_URL') || '';
    this.anonKey = this.config.get('SUPABASE_ANON_KEY') || '';
    this.serviceRoleKey = this.config.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  }

  // Global client - auth (login, register)
  getClient(): SupabaseClient {
    return createClient(this.url, this.anonKey);
  }

  // Client with user token - for authenticated requests
  getClientWithToken(accessToken: string): SupabaseClient {
    return createClient(this.url, this.anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }
  // Admin client - for server-side operations like file upload (bypasses RLS)
  getServiceClient(): SupabaseClient {
    return createClient(this.url, this.serviceRoleKey);
  }

  async uploadFile(bucket: string, path: string, file: Buffer, contentType: string) {
    const client = this.getServiceClient();

    const { error } = await client.storage
      .from(bucket)
      .upload(path, file, { contentType, upsert: true });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}