import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class CardService {

  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  searchCards(name: string): Observable<PokemonCard[]> {
    return this.http.get<PokemonCard[]>(`${this.apiUrl}/search?name=${name}`);
  }

  refreshPrices(): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh-prices`, {});
  }

  getLastRefresh(): Observable<any> {
  return this.http.get(`${this.apiUrl}/last-refresh`);
}

  getCards(): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.apiUrl}/cards`);
  }

  addCard(card: Card): Observable<any> {
    return this.http.post(`${this.apiUrl}/cards`, card);
  }

  deleteCard(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cards/${id}`);
  }

  getWishlist(): Observable<WishlistItem[]> {
    return this.http.get<WishlistItem[]>(`${this.apiUrl}/wishlist`);
  }

  addToWishlist(item: WishlistItem): Observable<any> {
    return this.http.post(`${this.apiUrl}/wishlist`, item);
  }

  removeFromWishlist(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/wishlist/${id}`);
  }

}