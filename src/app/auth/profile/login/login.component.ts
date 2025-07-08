import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, HostListener, Renderer2, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../service/auth.services';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, FormsModule],
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  authService = inject(AuthService);
  router = inject(Router);
  renderer = inject(Renderer2);
  private platformId = inject(PLATFORM_ID);
  
  // Track screen width for responsive adjustments - initialized safely in ngOnInit
  screenWidth: number = 0;
  
  // Helper to check if we're in a browser
  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  showPassword = false;
  rememberMe = false;
  errorMessage: string | null = null;
  isLoading = false;

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (this.isBrowser()) {
      this.screenWidth = window.innerWidth;
      this.fixMobileViewport(); // Re-apply viewport fixes on resize
    }
  }

  ngOnInit(): void {
    // Safely initialize browser-only variables using isPlatformBrowser check
    this.initBrowserFeatures();
    
    // Check if user is already authenticated and redirect
    if (this.isAuthenticated()) {
      this.router.navigateByUrl('/Modulo-Galpon/Dashboard');
    }
  }
  
  // Safely initialize browser features
  private initBrowserFeatures(): void {
    // Check if we're in a browser environment using Angular's isPlatformBrowser
    if (this.isBrowser()) {
      // Initialize screen width
      this.screenWidth = window.innerWidth;
      
      // Fix for mobile viewport issues
      this.fixMobileViewport();
      
      // Cargar credenciales guardadas si "Recordarme" estaba activado
      try {
        const savedEmail = localStorage.getItem('rememberedEmail');
        const savedPassword = localStorage.getItem('rememberedPassword');
        const rememberedStatus = localStorage.getItem('rememberMe');
        
        if (savedEmail && savedPassword) {
          this.form.patchValue({
            email: savedEmail,
            password: savedPassword
          });
          this.rememberMe = rememberedStatus === 'true';
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }
    }
  }
  
  // Fix for mobile viewport issues
  fixMobileViewport(): void {
    // Verify we're in a browser environment using Angular's isPlatformBrowser
    if (!this.isBrowser()) {
      return; // Skip if we're not in a browser (SSR)
    }
    
    try {
      // Apply CSS fixes for mobile
      if (this.screenWidth <= 640) {
        // Fix for iOS Safari and other mobile browsers
        this.renderer.setStyle(document.body, 'height', '100%');
        this.renderer.setStyle(document.body, 'overflow', 'hidden');
        this.renderer.setStyle(document.documentElement, 'height', '100%');
        this.renderer.setStyle(document.documentElement, 'overflow', 'hidden');
        
        // Fix viewport height (addresses iOS Safari issues)
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }
    } catch (error) {
      console.error('Error applying mobile viewport fixes:', error);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  isAuthenticated(): boolean {
    return this.authService.currentUserSig() !== null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    const rawForm = this.form.getRawValue();
    this.errorMessage = null;
    this.isLoading = true;
    
    // Guardar credenciales si "Recordarme" está activado (solo en navegador)
    if (this.isBrowser()) {
      try {
        if (this.rememberMe) {
          localStorage.setItem('rememberedEmail', rawForm.email);
          localStorage.setItem('rememberedPassword', rawForm.password);
          localStorage.setItem('rememberMe', 'true');
        } else {
          // Eliminar credenciales guardadas si "Recordarme" está desactivado
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
          localStorage.removeItem('rememberMe');
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }
    }
    
    this.authService.login(rawForm.email, rawForm.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigateByUrl('/Modulo-Galpon/Dashboard');
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || err.error || 'Ha ocurrido un error en el inicio de sesión';
      },
    });
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/Login');
  }
}