import { TestBed } from '@angular/core/testing';

import { TrailerPlayer } from './trailer-player';

describe('TrailerPlayer', () => {
  async function render(videoKey: string) {
    const fixture = TestBed.createComponent(TrailerPlayer);
    fixture.componentRef.setInput('videoKey', videoKey);
    fixture.componentRef.setInput('title', 'Inception');
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('embeds a valid YouTube id using the privacy-friendly domain', async () => {
    const el = await render('JE9z-gy4De4');
    const iframe = el.querySelector('iframe')!;

    expect(iframe.src).toBe('https://www.youtube-nocookie.com/embed/JE9z-gy4De4?autoplay=1&rel=0');
    expect(iframe.title).toBe('Inception trailer');
  });

  it('refuses anything that is not a plain video id', async () => {
    const el = await render('abc"><script>alert(1)</script>');

    expect(el.querySelector('iframe')).toBeNull();
    expect(el.textContent).toContain("This trailer can't be played.");
  });
});
