import { PitchClass } from "./pitch";
import { allModes, Mode, Triad } from "./triad";
import {
    apply, boundsOfPoints, distance, inverse, mat2, Mat2, Rect, rectContains, rectsOverlap, Vec2, vec2,
} from "./vec2";

// トネッツ図: 完全五度(+7)と長三度(+4)の2ベクトルの整数結合で表せる格子点に
// 各ピッチクラスを割り当てた無限平面。座標系はワールド座標(描画平面、単位は任意)と
// 格子座標(fifths, thirds)の2つで、このモジュールが相互変換と有限化(表示範囲内の列挙)を担う。

// 完全五度(+7)と長三度(+4)に対応するワールド座標上の基底ベクトル。
// 三角形を正三角形にする必然性はなく、図の縦横比はこの2定数で調整する。
// yはSVGに合わせて下向きが正。音程の上行を画面の上方向に対応させるためyは負
export const FIFTH_VECTOR: Vec2 = vec2(1, 0);
export const THIRD_VECTOR: Vec2 = vec2(0.55, -0.8);

const BASIS: Mat2 = mat2(FIFTH_VECTOR, THIRD_VECTOR);
const BASIS_INVERSE: Mat2 = inverse(BASIS);

// トネッツ格子上の格子点。ワールド座標 fifths * FIFTH_VECTOR + thirds * THIRD_VECTOR に置かれる
export type LatticePoint = { readonly fifths: number; readonly thirds: number };

export function latticePoint(fifths: number, thirds: number): LatticePoint {
    return { fifths, thirds };
}

export function latticePointEquals(a: LatticePoint, b: LatticePoint): boolean {
    return a.fifths === b.fifths && a.thirds === b.thirds;
}

// 原点(0, 0)をC(=PitchClass 0)とする各格子点のピッチクラス。
// 同名異音は区別しない(既存のPitchClassと完全互換)ため、同じピッチクラスは平面上に周期的に無限に現れる
export function latticePitchClass(p: LatticePoint): PitchClass {
    return new PitchClass(7 * p.fifths + 4 * p.thirds);
}

export function latticeToWorld(p: LatticePoint): Vec2 {
    return apply(BASIS, vec2(p.fifths, p.thirds));
}

// ワールド座標を実数の格子座標(x=fifths, y=thirds)に逆変換する
export function worldToLattice(w: Vec2): Vec2 {
    return apply(BASIS_INVERSE, w);
}

// rectの4隅を格子座標に逆変換し、含まれうる格子点の整数範囲(バウンディングボックス)を求める。
// rectは格子座標系では平行四辺形になるため、この範囲は過剰に広い可能性があるが、漏れはない
function latticeBoundsOfRect(rect: Rect): { minF: number; maxF: number; minT: number; maxT: number } {
    const corners = [
        rect.min,
        vec2(rect.max.x, rect.min.y),
        vec2(rect.min.x, rect.max.y),
        rect.max,
    ].map(worldToLattice);
    return {
        minF: Math.floor(Math.min(...corners.map(c => c.x))),
        maxF: Math.ceil(Math.max(...corners.map(c => c.x))),
        minT: Math.floor(Math.min(...corners.map(c => c.y))),
        maxT: Math.ceil(Math.max(...corners.map(c => c.y))),
    };
}

// rect内(境界含む)に位置する格子点を列挙する。無限平面を表示範囲で有限化する入口
export function latticePointsInRect(rect: Rect): LatticePoint[] {
    const bounds = latticeBoundsOfRect(rect);
    const points: LatticePoint[] = [];
    for (let t = bounds.minT; t <= bounds.maxT; t++) {
        for (let f = bounds.minF; f <= bounds.maxF; f++) {
            const p = latticePoint(f, t);
            if (rectContains(rect, latticeToWorld(p))) points.push(p);
        }
    }
    return points;
}

// 隣接する格子点対(=辺)の3方向。完全五度(+7)・長三度(+4)・短三度(五度-三度=+3)。
// 無向辺はこの3方向を各格子点から張ることで重複なく列挙できる
export const EDGE_DIRECTIONS: readonly LatticePoint[] = [
    latticePoint(1, 0),  // +7 完全五度
    latticePoint(0, 1),  // +4 長三度
    latticePoint(1, -1), // +3 短三度
];

export type LatticeEdge = { readonly from: LatticePoint; readonly to: LatticePoint };

// rectと(部分的にでも)重なる辺を列挙する
export function edgesInRect(rect: Rect): LatticeEdge[] {
    const bounds = latticeBoundsOfRect(rect);
    const edges: LatticeEdge[] = [];
    for (let t = bounds.minT - 1; t <= bounds.maxT + 1; t++) {
        for (let f = bounds.minF - 1; f <= bounds.maxF + 1; f++) {
            for (const direction of EDGE_DIRECTIONS) {
                const from = latticePoint(f, t);
                const to = latticePoint(f + direction.fifths, t + direction.thirds);
                const bbox = boundsOfPoints([latticeToWorld(from), latticeToWorld(to)]);
                if (rectsOverlap(rect, bbox)) edges.push({ from, to });
            }
        }
    }
    return edges;
}

// 三角形の同定。格子の1セル(格子点(f,t)を左下とする平行四辺形)は
//   major: [(f,t), (f+1,t), (f,t+1)] = ルートpitch(f,t)のメジャートライアド
//   minor: [(f+1,t), (f,t+1), (f+1,t+1)] = ルートpitch(f,t+1)のマイナートライアド
// の2枚の三角形に分かれる
export type TonnetzTriangle = { readonly fifths: number; readonly thirds: number; readonly mode: Mode };

export function triangleVertices(tri: TonnetzTriangle): [LatticePoint, LatticePoint, LatticePoint] {
    const { fifths: f, thirds: t } = tri;
    return tri.mode === "M"
        ? [latticePoint(f, t), latticePoint(f + 1, t), latticePoint(f, t + 1)]
        : [latticePoint(f + 1, t), latticePoint(f, t + 1), latticePoint(f + 1, t + 1)];
}

// 三角形が表すトライアド。majorのルートは(f,t)、minorのルートは長三度上の頂点(f,t+1)
export function triangleTriad(tri: TonnetzTriangle): Triad {
    const root = tri.mode === "M"
        ? latticePitchClass(latticePoint(tri.fifths, tri.thirds))
        : latticePitchClass(latticePoint(tri.fifths, tri.thirds + 1));
    return new Triad(root, tri.mode);
}

// rectと(部分的にでも)重なる三角形を列挙する
export function trianglesInRect(rect: Rect): TonnetzTriangle[] {
    const bounds = latticeBoundsOfRect(rect);
    const triangles: TonnetzTriangle[] = [];
    for (let t = bounds.minT - 1; t <= bounds.maxT; t++) {
        for (let f = bounds.minF - 1; f <= bounds.maxF; f++) {
            for (const mode of allModes) {
                const tri: TonnetzTriangle = { fifths: f, thirds: t, mode };
                const bbox = boundsOfPoints(triangleVertices(tri).map(latticeToWorld));
                if (rectsOverlap(rect, bbox)) triangles.push(tri);
            }
        }
    }
    return triangles;
}

// ワールド座標wに最も近い格子点。wを含むセルの4隅のうち最近傍を返す
export function nearestLatticePoint(w: Vec2): LatticePoint {
    const l = worldToLattice(w);
    const f = Math.floor(l.x);
    const t = Math.floor(l.y);
    const candidates = [
        latticePoint(f, t), latticePoint(f + 1, t),
        latticePoint(f, t + 1), latticePoint(f + 1, t + 1),
    ];
    return candidates.reduce((best, p) =>
        distance(latticeToWorld(p), w) < distance(latticeToWorld(best), w) ? p : best
    );
}

// ワールド座標wを含む三角形。セル内の小数部の和が1未満ならmajor(左下半分)、以上ならminor(右上半分)
export function triangleAtPoint(w: Vec2): TonnetzTriangle {
    const l = worldToLattice(w);
    const f = Math.floor(l.x);
    const t = Math.floor(l.y);
    const mode: Mode = (l.x - f) + (l.y - t) < 1 ? "M" : "m";
    return { fifths: f, thirds: t, mode };
}
