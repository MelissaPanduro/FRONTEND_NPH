import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../service/auth.services';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  styleUrls: ['./register.component.css'] // Archivo CSS para animaciones personalizadas
})
export class RegisterComponent {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  authService = inject(AuthService);
  router = inject(Router);

  showPassword = false;

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  errorMessage: string | null = null;

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    const rawForm = this.form.getRawValue();
    this.errorMessage = null;
    
    this.authService.register(rawForm.email, rawForm.username, rawForm.password).subscribe({
      next: () => {
        // Redirigir al login después de registrarse
        this.router.navigateByUrl('/Login');
      },
      error: (err) => {
        this.errorMessage = err.error || 'Ha ocurrido un error en el registro';
      },
    });
  }
}