import { Routes } from '@angular/router';
import { CollectionComponent } from './components/collection/collection';
import { WishlistComponent }   from './components/wishlist/wishlist';
import { SearchComponent }     from './components/search/search';
import { DashboardComponent }  from './components/dashboard/dashboard';
import { AuthComponent }       from './components/auth/auth';
import { DemoComponent }       from './components/demo/demo';
import { HomeComponent }       from './components/home/home';
import { AuthGuard }           from './guards/auth-guard';

export const routes: Routes = [
  { path: '',           component: HomeComponent },
  { path: 'auth',       component: AuthComponent },
  { path: 'demo',       component: DemoComponent },
  { path: 'dashboard',  component: DashboardComponent,  canActivate: [AuthGuard] },
  { path: 'collection', component: CollectionComponent, canActivate: [AuthGuard] },
  { path: 'wishlist',   component: WishlistComponent,   canActivate: [AuthGuard] },
  { path: 'search',     component: SearchComponent,     canActivate: [AuthGuard] },
];