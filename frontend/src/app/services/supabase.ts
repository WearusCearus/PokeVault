import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jahaachaazdsczqmtmgx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphaGFhY2hhYXpkc2N6cW10bWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTQ0OTEsImV4cCI6MjA4NzM5MDQ5MX0.kL5UO2HyKzMbRmZJXbEfzmzUiWAvs3h9JYm2F5nacR0';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  async getUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  async getSession() {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  async signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async signInWithGoogle() {
    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://poke-vault-bid753y0e-wearuscearus-projects.vercel.app/dashboard'
      }
    });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  onAuthChange(callback: (user: User | null) => void) {
    this.supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null);
    });
  }

  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.access_token ?? null;
  }

}