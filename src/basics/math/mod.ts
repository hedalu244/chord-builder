export type Mod12 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
}

export function mod12(number: number): Mod12 {
    const normalized = Math.round(mod(number, 12));
    return normalized as Mod12;
}