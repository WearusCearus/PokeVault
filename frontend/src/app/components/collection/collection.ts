import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardService, Card } from '../../services/card';

@Component({
  selector: 'app-collection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './collection.html',
  styleUrl: './collection.css'
})
export class CollectionComponent implements OnInit {

  cards        = signal<Card[]>([]);
  isLoading    = signal(true);
  isRefreshing = signal(false);
  errorMessage = signal('');
  searchQuery  = signal('');

  filteredCards = computed(() =>
    this.cards().filter(card =>
      card.name.toLowerCase().includes(this.searchQuery().toLowerCase())
    )
  );

  newCard: Card = {
    name:          '',
    current_price: 0,
    rarity:        '',
    emoji:         ''
  };

  constructor(private cardService: CardService) {}

  ngOnInit() {
  this.loadCards();
  this.refreshPrices();
  this.loadLastRefresh();

}

  loadCards() {
    this.isLoading.set(true);

    this.cardService.getCards().subscribe({
      next: (data) => {
        this.cards.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Could not load cards. Is your API running?');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  updateSearch(value: string) {
    this.searchQuery.set(value);
  }

  refreshPrices() {
  this.isRefreshing.set(true);

  this.cardService.refreshPrices().subscribe({
    next: (data) => {
      if (data.skipped) {
        console.log(data.message);
        this.isRefreshing.set(false);
      } else {
        this.loadCards();
        this.isRefreshing.set(false);
      }
    },
    error: (err) => {
      this.errorMessage.set('Could not refresh prices.');
      this.isRefreshing.set(false);
    }
  });
}

    lastRefresh = signal<string>('');

    loadLastRefresh() {
      this.cardService.getLastRefresh().subscribe({
        next: (data) => {
          if (data.last_refresh) {
            const date = new Date(data.last_refresh);
            this.lastRefresh.set(date.toLocaleString());
          }
        },
        error: () => {}
      });
    }

  addCard() {
    if (!this.newCard.name) return;

    this.cardService.addCard(this.newCard).subscribe({
      next: () => {
        this.loadCards();
        this.newCard = { name: '', current_price: 0, rarity: '', emoji: '' };
      },
      error: (err) => {
        this.errorMessage.set('Could not add card.');
        console.error(err);
      }
    });
  }

  deleteCard(id: number) {
    this.cardService.deleteCard(id).subscribe({
      next: () => this.loadCards(),
      error: (err) => {
        this.errorMessage.set('Could not delete card.');
        console.error(err);
      }
    });
  }

}