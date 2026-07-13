// 2次元ベクトルと2x2行列の最小限の演算。音楽やGUIの概念には依存しない純粋な数学モジュール

export type Vec2 = { readonly x: number; readonly y: number };

export function vec2(x: number, y: number): Vec2 {
    return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
    return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
    return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec2, s: number): Vec2 {
    return { x: v.x * s, y: v.y * s };
}

export function distance(a: Vec2, b: Vec2): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

// 列ベクトルu, vを並べた2x2行列 [u v]。基底変換に使う
export type Mat2 = { readonly u: Vec2; readonly v: Vec2 };

export function mat2(u: Vec2, v: Vec2): Mat2 {
    return { u, v };
}

// m * w (wの各成分を係数として列ベクトルu, vを合成する)
export function apply(m: Mat2, w: Vec2): Vec2 {
    return { x: m.u.x * w.x + m.v.x * w.y, y: m.u.y * w.x + m.v.y * w.y };
}

export function determinant(m: Mat2): number {
    return m.u.x * m.v.y - m.u.y * m.v.x;
}

export function inverse(m: Mat2): Mat2 {
    const det = determinant(m);
    return {
        u: { x: m.v.y / det, y: -m.u.y / det },
        v: { x: -m.v.x / det, y: m.u.x / det },
    };
}
