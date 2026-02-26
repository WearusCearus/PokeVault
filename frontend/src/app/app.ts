import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from './services/supabase';
import { DemoService } from './services/demo';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {

  user = signal<any>(null);

  constructor(
    private supabase: SupabaseService,
    public demoService: DemoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.supabase.onAuthChange((user) => {
      this.user.set(user);

      if (user?.email === 'demo@pokevault.app') {
        this.demoService.enable();
      } else {
        this.demoService.disable();
      }
    });
  }

  async signOut() {
    await this.supabase.signOut();
    this.demoService.disable();
    this.user.set(null);
    this.router.navigate(['/']);
  }

}