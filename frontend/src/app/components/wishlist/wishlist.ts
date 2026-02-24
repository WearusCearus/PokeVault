import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardService, WishlistItem } from '../../services/card';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css'
})
export class WishlistComponent implements OnInit {

  items        = signal<WishlistItem[]>([]);
  isLoading    = signal(true);
  isRefreshing = signal(false);
  errorMessage = signal('');
  searchQuery  = signal('');
  lastRefresh  = signal<string>('');

  filteredItems = computed(() =>
    this.items().filter(item =>
      item.name.toLowerCase().includes(this.searchQuery().toLowerCase())
    )
  );

  newItem: WishlistItem = {
    name:          '',
    rarity:        '',
    current_price: 0,
    priority:      'low',
    emoji:         ''
  };

  constructor(private cardService: CardService) {}

  ngOnInit() {
    this.loadWishlist();
    this.loadLastRefresh();
    this.refreshPrices();
  }

  loadWishlist() {
    this.isLoading.set(true);

    this.cardService.getWishlist().subscribe({
      next: (data) => {
        this.items.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Could not load wishlist. Is your API running?');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  updateSearch(value: string) {
    this.searchQuery.set(value);
  }

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

  refreshPrices() {
    this.isRefreshing.set(true);

    this.cardService.refreshPrices().subscribe({
      next: (data) => {
        if (data.skipped) {
          console.log(data.message);
          this.isRefreshing.set(false);
        } else {
          this.loadWishlist();
          this.loadLastRefresh();
          this.isRefreshing.set(false);
        }
      },
      error: (err) => {
        this.errorMessage.set('Could not refresh prices.');
        this.isRefreshing.set(false);
      }
    });
  }

  addItem() {
    if (!this.newItem.name) return;

    this.cardService.addToWishlist(this.newItem).subscribe({
      next: () => {
        this.loadWishlist();
        this.newItem = { name: '', rarity: '', current_price: 0, priority: 'low', emoji: '' };
      },
      error: (err) => {
        this.errorMessage.set('Could not add item.');
        console.error(err);
      }
    });
  }

  removeItem(id: number) {
    this.cardService.removeFromWishlist(id).subscribe({
      next: () => this.loadWishlist(),
      error: (err) => {
        this.errorMessage.set('Could not remove item.');
        console.error(err);
      }
    });
  }

  priorityColor(priority: string): string {
    if (priority === 'high') return '#ff5b5b';
    if (priority === 'med')  return '#ffd74e';
    return '#666b80';
  }

}