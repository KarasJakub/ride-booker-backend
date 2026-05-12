import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private url: string;
  private anonKey: string;

  constructor(private config: ConfigService) {
    this.url = this.config.get('SUPABASE_URL') || '';
    this.anonKey = this.config.get('SUPABASE_ANON_KEY') || '';
  }

  // Global client — auth (login, register)
  getClient(): SupabaseClient {
    return createClient(this.url, this.anonKey);
  }

  // Client with user token — for authenticated requests
  getClientWithToken(accessToken: string): SupabaseClient {
    return createClient(this.url, this.anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }
}