import { Routes } from '@angular/router';
import { CollectionComponent } from './components/collection/collection';
import { WishlistComponent } from './components/wishlist/wishlist';
import { SearchComponent }     from './components/search/search';


export const routes: Routes = [
  { path: '',           redirectTo: 'collection', pathMatch: 'full' },
  { path: 'collection', component: CollectionComponent },
  { path: 'wishlist',   component: WishlistComponent },
  { path: 'search',     component: SearchComponent },

];