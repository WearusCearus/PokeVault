import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, ],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class AuthComponent {

  // Toggle between login and signup
  mode         = signal<'login' | 'signup'>('login');
  email        = '';
  password     = '';
  isLoading    = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  toggleMode() {
    this.mode.set(this.mode() === 'login' ? 'signup' : 'login');
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  async submit() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please fill in all fields.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    if (this.mode() === 'signup') {
      const { error } = await this.supabase.signUp(this.email, this.password);
      if (error) {
        this.errorMessage.set(error.message);
      } else {
        this.successMessage.set('Check your email to confirm your account!');
      }
    } else {
      const { error } = await this.supabase.signIn(this.email, this.password);
      if (error) {
        this.errorMessage.set(error.message);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }

    this.isLoading.set(false);
  }

  async signInWithGoogle() {
    this.isLoading.set(true);
    const { error } = await this.supabase.signInWithGoogle();
    if (error) {
      this.errorMessage.set(error.message);
      this.isLoading.set(false);
    }
  }

}