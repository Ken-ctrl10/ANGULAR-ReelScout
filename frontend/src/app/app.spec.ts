import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';

describe('Hamburger menu', () => {
  async function render() {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const toggle = el.querySelector('.menu-toggle') as HTMLButtonElement;
    const open = async () => {
      toggle.click();
      await fixture.whenStable();
    };
    return { fixture, el, toggle, open };
  }

  it('opens and closes with the button', async () => {
    const { fixture, toggle, open } = await render();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    await open();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Close menu');

    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes after choosing a link', async () => {
    const { fixture, el, open } = await render();
    await open();

    (el.querySelector('.main-nav a') as HTMLElement).click();
    await fixture.whenStable();

    expect(fixture.componentInstance.menuOpen()).toBe(false);
  });

  it('closes with Escape and when tapping outside', async () => {
    const { fixture, open } = await render();

    await open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.componentInstance.menuOpen()).toBe(false);

    await open();
    document.body.click();
    expect(fixture.componentInstance.menuOpen()).toBe(false);
  });
});
