import { Routes } from '@angular/router';
import { CollectionComponent } from './components/collection/collection';
import { WishlistComponent } from './components/wishlist/wishlist';
import { SearchComponent }     from './components/search/search';
import { DashboardComponent }  from './components/dashboard/dashboard';


export const routes: Routes = [
  { path: '',           redirectTo: 'collection', pathMatch: 'full' },
  { path: 'collection', component: CollectionComponent },
  { path: 'wishlist',   component: WishlistComponent },
  { path: 'search',     component: SearchComponent },
  { path: 'dashboard',  component: DashboardComponent },

];