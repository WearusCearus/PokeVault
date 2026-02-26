import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { SupabaseService } from './supabase';

export interface Card {
  id?:           number;
  name:          string;
  current_price: number;
  rarity:        string;
  emoji:         string;
  image?:        string;
}

export interface WishlistItem {
  id?:           number;
  name:          string;
  rarity:        string;
  current_price: number;
  priority:      string;
  emoji:         string;
  image?:        string;
}

export interface PokemonCard {
  api_id:        string;
  name:          string;
  rarity:        string;
  set_name:      string;
  image:         string;
  current_price: number;
}

export interface Stats {
  totalCards:    number;
  totalValue:    string;
  avgPrice:      string;
  totalWishlist: number;
  topCards:      Card[];
  recentCards:   Card[];
}

@Injectable({
  providedIn: 'root'
})
export class CardService {

  private apiUrl = 'https://pokevault-production-0f04.up.railway.app/api';

  constructor(
    private http: HttpClient,
    private supabase: SupabaseService
  ) {}

  private getHeaders(): Observable<HttpHeaders> {
    return from(this.supabase.getAccessToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return [headers];
      })
    );
  }

  private authGet<T>(url: string): Observable<T> {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.get<T>(url, { headers }))
    );
  }

  private authPost<T>(url: string, body: any): Observable<T> {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.post<T>(url, body, { headers }))
    );
  }

  private authDelete<T>(url: string): Observable<T> {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.delete<T>(url, { headers }))
    );
  }

  // COLLECTION

  getCards(): Observable<Card[]> {
    return this.authGet<Card[]>(`${this.apiUrl}/cards`);
  }

  addCard(card: Card): Observable<any> {
    return this.authPost(`${this.apiUrl}/cards`, card);
  }

  deleteCard(id: number): Observable<any> {
    return this.authDelete(`${this.apiUrl}/cards/${id}`);
  }

  // WISHLIST

  getWishlist(): Observable<WishlistItem[]> {
    return this.authGet<WishlistItem[]>(`${this.apiUrl}/wishlist`);
  }

  addToWishlist(item: WishlistItem): Observable<any> {
    return this.authPost(`${this.apiUrl}/wishlist`, item);
  }

  removeFromWishlist(id: number): Observable<any> {
    return this.authDelete(`${this.apiUrl}/wishlist/${id}`);
  }

  private authPatch<T>(url: string, body: any): Observable<T> {
    return this.getHeaders().pipe(
      switchMap(headers => this.http.patch<T>(url, body, { headers }))
    );
  }

  updatePriority(id: number, priority: string): Observable<any> {
    return this.authPatch(`${this.apiUrl}/wishlist/${id}/priority`, { priority });
  }

  // STATS

  getStats(): Observable<Stats> {
    return this.authGet<Stats>(`${this.apiUrl}/stats`);
  }

  // PRICES

  refreshPrices(): Observable<any> {
    return this.authPost(`${this.apiUrl}/refresh-prices`, {});
  }

  getLastRefresh(): Observable<any> {
    return this.authGet(`${this.apiUrl}/last-refresh`);
  }

  // SEARCH

  searchCards(name: string): Observable<PokemonCard[]> {
    return this.authGet<PokemonCard[]>(`${this.apiUrl}/search?name=${name}`);
  }

}