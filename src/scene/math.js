export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (from, to, amount) => from + (to - from) * amount;
export const smoothstep = (from, to, value) => {
  if (from === to) return value < from ? 0 : 1;
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};
export const easeInOut = (value) => {
  const t = clamp(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
