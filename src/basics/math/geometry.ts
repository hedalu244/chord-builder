// 軸平行矩形・三角形の内心などの平面幾何。音楽やGUIの概念には依存しない純粋な数学モジュール

import { distance, Vec2, vec2 } from "./vec2";

// 軸平行の矩形。min.x <= max.x かつ min.y <= max.y を仮定する
export type Rect = { readonly min: Vec2; readonly max: Vec2 };

export function rect(min: Vec2, max: Vec2): Rect {
    return { min, max };
}

export function rectContains(r: Rect, p: Vec2): boolean {
    return r.min.x <= p.x && p.x <= r.max.x && r.min.y <= p.y && p.y <= r.max.y;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
    return a.min.x <= b.max.x && b.min.x <= a.max.x && a.min.y <= b.max.y && b.min.y <= a.max.y;
}

export function expandRect(r: Rect, margin: number): Rect {
    return {
        min: { x: r.min.x - margin, y: r.min.y - margin },
        max: { x: r.max.x + margin, y: r.max.y + margin },
    };
}

export function boundsOfPoints(points: readonly Vec2[]): Rect {
    return {
        min: { x: Math.min(...points.map(p => p.x)), y: Math.min(...points.map(p => p.y)) },
        max: { x: Math.max(...points.map(p => p.x)), y: Math.max(...points.map(p => p.y)) },
    };
}

// 三角形の内心(内接円の中心 = 3辺から等距離の点)。
// 頂点よりも「三角形の中身」を代表する点が欲しいときに使う
export function incenter(vertices: readonly [Vec2, Vec2, Vec2]): Vec2 {
    const [a, b, c] = vertices;
    const la = distance(b, c); // 頂点aの対辺の長さ
    const lb = distance(c, a);
    const lc = distance(a, b);
    const sum = la + lb + lc;
    return vec2(
        (la * a.x + lb * b.x + lc * c.x) / sum,
        (la * a.y + lb * b.y + lc * c.y) / sum
    );
}
