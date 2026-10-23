import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Register } from './register';

describe('Register page', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  function create() {
    const fixture = TestBed.createComponent(Register);
    return { fixture, page: fixture.componentInstance };
  }

  it('is invalid and sends nothing when submitted empty', () => {
    const { page } = create();

    page.submit();

    expect(page.form.invalid).toBe(true);
    expect(page.form.controls.email.touched).toBe(true); // errors are now visible
    http.expectNone(() => true);
  });

  it('flags passwords that do not match', () => {
    const { page } = create();
    page.form.setValue({ name: 'Ken', email: 'ken@example.test', password: 'secret-pass-1', password_confirmation: 'other' });

    expect(page.form.hasError('passwordsMismatch')).toBe(true);
  });

  it('shows the error text in the page', async () => {
    const { fixture, page } = create();
    page.form.setValue({ name: 'Ken', email: 'ken@example.test', password: 'secret-pass-1', password_confirmation: 'other' });
    page.form.controls.password_confirmation.markAsTouched();

    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain("Passwords don't match.");
  });

  it('shows Laravel validation errors under the right field', async () => {
    const { fixture, page } = create();
    page.form.setValue({ name: 'Ken', email: 'taken@example.test', password: 'secret-pass-1', password_confirmation: 'secret-pass-1' });

    page.submit();
    http
      .expectOne((r) => r.url.endsWith('/register'))
      .flush(
        { message: 'The email has already been taken.', errors: { email: ['The email has already been taken.'] } },
        { status: 422, statusText: 'Unprocessable Content' },
      );
    await fixture.whenStable();

    expect(page.serverErrors()['email']).toBe('The email has already been taken.');
    expect(fixture.nativeElement.textContent).toContain('The email has already been taken.');
    expect(page.submitting()).toBe(false);
  });
});
