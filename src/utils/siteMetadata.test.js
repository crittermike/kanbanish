import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const root = new URL('../../', import.meta.url);
const readAsset = (path) => readFileSync(new URL(`public/${path}`, root));

describe('crawler-visible site icons', () => {
  it('advertises branded PNG icons in the raw HTML, without JavaScript', () => {
    const { document } = new JSDOM(readFileSync(new URL('index.html', root), 'utf8')).window;
    const favicon = document.querySelector('link[rel="icon"]');
    const touchIcon = document.querySelector('link[rel="apple-touch-icon"]');

    expect(favicon.getAttribute('href')).toBe('/favicon.png');
    expect(favicon.getAttribute('type')).toBe('image/png');
    expect(touchIcon.getAttribute('href')).toBe('/apple-touch-icon.png');

    for (const icon of [favicon, touchIcon]) {
      const png = readAsset(icon.getAttribute('href').slice(1));
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(icon.getAttribute('sizes')).toBe(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`);
    }
  });

  it.each([192, 512])('serves existing branding at the legacy logo%s.png URL', (size) => {
    expect(readAsset(`logo${size}.png`).equals(readAsset(`android-chrome-${size}x${size}.png`))).toBe(true);
  });
});
