export function gradientThumb(seed: string): string {
  const h = Math.abs(hash(seed)) % 360;
  const h2 = (h + 40) % 360;
  const c1 = `hsl(${h} 90% 88%)`;
  const c2 = `hsl(${h2} 90% 82%)`;
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}

function hash(s: string): number {
  let x = 0;
  for (let i = 0; i < s.length; i++) {
    x = (x << 5) - x + s.charCodeAt(i);
  }
  return x;
}
