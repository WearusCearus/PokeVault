import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardService, WishlistItem } from '../../services/card';
import { DemoService } from '../../services/demo';


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

  sortBy = signal('created_at');

  filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase();

    const filtered = this.items().filter(item =>
      item.name.toLowerCase().includes(query)
    );

    const sort = this.sortBy();
    const priorityOrder: Record<string, number> = { high: 0, med: 1, low: 2 };

    return [...filtered].sort((a, b) => {
      if (sort === 'price_high') return b.current_price - a.current_price;
      if (sort === 'price_low')  return a.current_price - b.current_price;
      if (sort === 'name')       return a.name.localeCompare(b.name);
      if (sort === 'rarity')     return (a.rarity || '').localeCompare(b.rarity || '');
      if (sort === 'priority')   return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
      return 0;
    });
  });

  updateSort(value: string) {
    this.sortBy.set(value);
  }

  newItem: WishlistItem = {
    name:          '',
    rarity:        '',
    current_price: 0,
    priority:      'low',
    emoji:         ''
  };

  constructor(
    private cardService: CardService,   
    public demoService: DemoService) {}

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
    if (this.demoService.isDemoMode()) {
      this.errorMessage.set('Demo mode — sign up to build your own wishlist!');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }

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
    if (this.demoService.isDemoMode()) {
      this.errorMessage.set('Demo mode — sign up to manage your own wishlist!');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }
    this.cardService.removeFromWishlist(id).subscribe({
      next: () => this.loadWishlist(),
      error: (err) => {
        this.errorMessage.set('Could not remove item.');
        console.error(err);
      }
    });
  }

  openDropdown = signal<number | null>(null);

  toggleDropdown(id: number) {
    this.openDropdown.set(this.openDropdown() === id ? null : id);
  }

  setPriority(item: WishlistItem, priority: string) {
    if (this.demoService.isDemoMode()) return;
    
    this.cardService.updatePriority(item.id!, priority).subscribe({
      next: () => {
        this.items.update(items =>
          items.map(i => i.id === item.id ? { ...i, priority } : i)
        );
        this.openDropdown.set(null);
      },
      error: (err) => {
        this.errorMessage.set('Could not update priority.');
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