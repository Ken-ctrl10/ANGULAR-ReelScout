import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { errorMessage, fieldErrors } from '../../core/error-message';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Reactive form: the fields and their validation rules live in TypeScript.
  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // show the field errors
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.serverErrors.set({});

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        // Go back to the page that sent us here (e.g. ?returnUrl=/favorites), or home.
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl?.startsWith('/') ? returnUrl : '/');
      },
      error: (err) => {
        this.submitting.set(false);
        const fields = fieldErrors(err);
        this.serverErrors.set(fields);
        if (!Object.keys(fields).length) {
          this.error.set(errorMessage(err));
        }
      },
    });
  }

  showError(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }
}
