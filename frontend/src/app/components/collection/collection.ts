import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardService, Card } from '../../services/card';
import { DemoService } from '../../services/demo';


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

sortBy = signal('created_at');

  filteredCards = computed(() => {
    const query = this.searchQuery().toLowerCase();

    const filtered = this.cards().filter(card =>
      card.name.toLowerCase().includes(query)
    );

    const sort = this.sortBy();

    return [...filtered].sort((a, b) => {
      if (sort === 'price_high') return b.current_price - a.current_price;
      if (sort === 'price_low')  return a.current_price - b.current_price;
      if (sort === 'name')       return a.name.localeCompare(b.name);
      if (sort === 'rarity')     return (a.rarity || '').localeCompare(b.rarity || '');
      return 0; // default: created_at order from API
    });
  });

  updateSort(value: string) {
    this.sortBy.set(value);
  }

  newCard: Card = {
    name:          '',
    current_price: 0,
    rarity:        '',
    emoji:         ''
  };

  constructor(
    private cardService: CardService,
    public demoService: DemoService
  ) {}

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
  if (this.demoService.isDemoMode()) return;

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
    if (this.demoService.isDemoMode()) {
      this.errorMessage.set('Demo mode — sign up to add cards to your own collection!');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }
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
    if (this.demoService.isDemoMode()) {
      this.errorMessage.set('Demo mode — sign up to manage your own collection!');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }

    this.cardService.deleteCard(id).subscribe({
      next: () => this.loadCards(),
      error: (err) => {
        this.errorMessage.set('Could not delete card.');
        console.error(err);
      }
    });
  }

}