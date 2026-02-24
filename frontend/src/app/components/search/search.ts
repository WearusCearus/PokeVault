import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardService, PokemonCard, Card, WishlistItem } from '../../services/card';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class SearchComponent {

  searchQuery  = signal('');
  results      = signal<PokemonCard[]>([]);
  isLoading    = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(private cardService: CardService) {}

  search() {
    if (!this.searchQuery()) return;

    this.isLoading.set(true);
    this.results.set([]);
    this.errorMessage.set('');

    this.cardService.searchCards(this.searchQuery()).subscribe({
      next: (data) => {
        this.results.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Could not search cards. Is your API running?');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  addToCollection(card: PokemonCard) {
  const newCard: Card = {
    name:          card.name,
    rarity:        card.rarity,
    current_price: card.current_price,
    emoji:         '🃏',
    image:         card.image,
  };

  this.cardService.addCard(newCard).subscribe({
    next: () => {
      this.successMessage.set(`${card.name} added to your collection!`);
      setTimeout(() => this.successMessage.set(''), 3000);
    },
    error: (err) => {
      this.errorMessage.set('Could not add card.');
      console.error(err);
    }
  });
}

  addToWishlist(card: PokemonCard) {
    const newItem: WishlistItem = {
      name:          card.name,
      rarity:        card.rarity,
      current_price: card.current_price,
      priority:      'low',
      emoji:         '🃏',
      image:         card.image,
    };

    this.cardService.addToWishlist(newItem).subscribe({
      next: () => {
        this.successMessage.set(`${card.name} added to your wishlist!`);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.errorMessage.set('Could not add to wishlist.');
        console.error(err);
      }
    });
  }

  updateSearch(value: string) {
    this.searchQuery.set(value);
  }

}