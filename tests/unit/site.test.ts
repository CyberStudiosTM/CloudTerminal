import { expect, it } from 'vitest';
import { starterSite } from '../../src/site';
import palette from '../../src/themes/default.json';

it('generates standalone themed HTML and escapes the title', () => {
  const html = starterSite('<script> & Skies', palette);
  expect(html).toContain('<title>&lt;script&gt; &amp; Skies</title>');
  expect(html).toContain('background: #202842');
  expect(html).not.toContain('<script>');
});
