import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { DemoService } from '../../services/demo';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demo.html',
  styleUrl: './demo.css'
})
export class DemoComponent {

  isLoading    = signal(false);
  errorMessage = signal('');

  private demoEmail    = 'demo@pokevault.app';
  private demoPassword = 'PokéVault2024!';

  constructor(
    private supabase: SupabaseService,
    private demoService: DemoService,
    private router: Router
  ) {}

  async enterDemo() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const { error } = await this.supabase.signIn(this.demoEmail, this.demoPassword);

    if (error) {
      this.errorMessage.set('Could not load demo. Please try again.');
      this.isLoading.set(false);
    } else {
      // Enable demo mode before navigating
      this.demoService.enable();
      this.router.navigate(['/dashboard']);
    }
  }

}