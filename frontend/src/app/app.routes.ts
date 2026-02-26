import { Routes } from '@angular/router';
import { CollectionComponent } from './components/collection/collection';
import { WishlistComponent }   from './components/wishlist/wishlist';
import { SearchComponent }     from './components/search/search';
import { DashboardComponent }  from './components/dashboard/dashboard';
import { AuthComponent }       from './components/auth/auth';
import { AuthGuard }           from './guards/auth-guard';

export const routes: Routes = [
  { path: '',           redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'auth',       component: AuthComponent },
  { path: 'dashboard',  component: DashboardComponent,  canActivate: [AuthGuard] },
  { path: 'collection', component: CollectionComponent, canActivate: [AuthGuard] },
  { path: 'wishlist',   component: WishlistComponent,   canActivate: [AuthGuard] },
  { path: 'search',     component: SearchComponent,     canActivate: [AuthGuard] },
];