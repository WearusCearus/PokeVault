import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DemoService {

  // When true, write operations are blocked
  isDemoMode = signal(false);

  enable()  { this.isDemoMode.set(true);  }
  disable() { this.isDemoMode.set(false); }

}