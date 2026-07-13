import { PitchClass } from "./pitch";
import { allModes, Mode, Triad } from "./triad";
import { boundsOfPoints, incenter, Rect, rectContains, rectsOverlap } from "./math/geometry";
import { add, apply, distance, inverse, mat2, Mat2, Vec2, vec2 } from "./math/vec2";

// トネッツ図: 完全五度(+7)と長三度(+4)の2ベクトルの整数結合で表せる格子点に
// 各ピッチクラスを割り当てた無限平面。
//
// このモジュールは格子座標(fifths, thirds)を内部実装として隠蔽し、外部(描画・操作)には
// ワールド座標(描画平面、単位は五度1歩分)と音楽的な意味(PitchClass / Triad)だけを渡す。
// 公開APIは次の2系統:
//   - tonnetzView(rect): 表示範囲内のノード・辺・三角形を、描画に必要なデータ一式で列挙する(無限平面の有限化)
//   - tonnetzHit(world) / nearestTriad(world, mode?): ワールド座標の一点を音楽的な対象に解釈する

// --- 内部: 格子座標系とワールド座標の相互変換 ---

// 完全五度(+7)と長三度(+4)に対応するワールド座標上の基底ベクトル。
// 三角形を正三角形にする必然性はなく、図の縦横比はこの2定数で調整する。
// yはSVGに合わせて下向きが正。音程の上行を画面の上方向に対応させるためyは負
const FIFTH_VECTOR: Vec2 = vec2(1, 0);
const THIRD_VECTOR: Vec2 = vec2(0.55, -0.8);

const BASIS: Mat2 = mat2(FIFTH_VECTOR, THIRD_VECTOR);
const BASIS_INVERSE: Mat2 = inverse(BASIS);

// トネッツ格子上の格子点。ワールド座標 fifths * FIFTH_VECTOR + thirds * THIRD_VECTOR に置かれる
type LatticePoint = { readonly fifths: number; readonly thirds: number };

function latticePoint(fifths: number, thirds: number): LatticePoint {
    return { fifths, thirds };
}

// 原点(0, 0)をC(=PitchClass 0)とする各格子点のピッチクラス。
// 同名異音は区別しない(既存のPitchClassと完全互換)ため、同じピッチクラスは平面上に周期的に無限に現れる
function latticePitchClass(p: LatticePoint): PitchClass {
    return new PitchClass(7 * p.fifths + 4 * p.thirds);
}

function latticeToWorld(p: LatticePoint): Vec2 {
    return apply(BASIS, vec2(p.fifths, p.thirds));
}

// ワールド座標を実数の格子座標(x=fifths, y=thirds)に逆変換する
function worldToLattice(w: Vec2): Vec2 {
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

// 隣接する格子点対(=辺)の3方向。完全五度(+7)・長三度(+4)・短三度(五度-三度=+3)。
// 無向辺はこの3方向を各格子点から張ることで重複なく列挙できる
const EDGE_DIRECTIONS: readonly LatticePoint[] = [
    latticePoint(1, 0),  // +7 完全五度
    latticePoint(0, 1),  // +4 長三度
    latticePoint(1, -1), // +3 短三度
];

// --- 内部: 三角形の同定 ---

// 格子の1セル(格子点(f,t)を左下とする平行四辺形)は
//   major: [(f,t), (f+1,t), (f,t+1)] = ルートpitch(f,t)のメジャートライアド
//   minor: [(f+1,t), (f,t+1), (f+1,t+1)] = ルートpitch(f,t+1)のマイナートライアド
// の2枚の三角形に分かれる
type TriangleId = { readonly fifths: number; readonly thirds: number; readonly mode: Mode };

function triangleLatticeVertices(tri: TriangleId): [LatticePoint, LatticePoint, LatticePoint] {
    const { fifths: f, thirds: t } = tri;
    return tri.mode === "M"
        ? [latticePoint(f, t), latticePoint(f + 1, t), latticePoint(f, t + 1)]
        : [latticePoint(f + 1, t), latticePoint(f, t + 1), latticePoint(f + 1, t + 1)];
}

// 三角形が表すトライアド。majorのルートは(f,t)、minorのルートは長三度上の頂点(f,t+1)
function triangleTriad(tri: TriangleId): Triad {
    const root = tri.mode === "M"
        ? latticePitchClass(latticePoint(tri.fifths, tri.thirds))
        : latticePitchClass(latticePoint(tri.fifths, tri.thirds + 1));
    return new Triad(root, tri.mode);
}

// 三角形の内心。頂点よりも「三角形の中身」を代表する点として、ラベルの配置と
// 最寄り三角形のクリック判定に使う。三角形は2種(major/minor)の平行移動しか存在しないため、
// セル原点(f,t)からのオフセットをモードごとに事前計算して記憶しておく
const INCENTER_OFFSETS: Readonly<Record<Mode, Vec2>> = {
    M: incenter(triangleLatticeVertices({ fifths: 0, thirds: 0, mode: "M" }).map(latticeToWorld) as [Vec2, Vec2, Vec2]),
    m: incenter(triangleLatticeVertices({ fifths: 0, thirds: 0, mode: "m" }).map(latticeToWorld) as [Vec2, Vec2, Vec2]),
};

function triangleIncenter(tri: TriangleId): Vec2 {
    return add(latticeToWorld(latticePoint(tri.fifths, tri.thirds)), INCENTER_OFFSETS[tri.mode]);
}

// --- 公開: 表示用の構造化データ ---

// トネッツ図上のノード(=格子点)1つ分の描画データ。同じピッチクラスは平面上に周期的に
// 何度も現れるため、位置(world)とピッチクラスは別物として両方持つ。keyはReactのkeyなど
// 平面上の同一性の識別に使う(ピッチクラスの同一性ではない)
export type TonnetzNode = {
    readonly key: string;
    readonly pitchClass: PitchClass;
    readonly world: Vec2;
};

// 隣接ノード対(完全五度・長三度・短三度のいずれかの間隔)を結ぶ辺
export type TonnetzEdge = {
    readonly key: string;
    readonly from: TonnetzNode;
    readonly to: TonnetzNode;
};

// トライアドを表す三角形。verticesは構成音3つのノード、incenterはラベル配置に使える代表点
export type TonnetzTriangle = {
    readonly key: string;
    readonly triad: Triad;
    readonly vertices: readonly [TonnetzNode, TonnetzNode, TonnetzNode];
    readonly incenter: Vec2;
};

// 表示範囲(ワールド座標のrect)と重なるノード・辺・三角形の一式。無限平面を有限化した結果
export type TonnetzView = {
    readonly nodes: readonly TonnetzNode[];
    readonly edges: readonly TonnetzEdge[];
    readonly triangles: readonly TonnetzTriangle[];
};

function nodeAt(p: LatticePoint): TonnetzNode {
    return {
        key: `${p.fifths},${p.thirds}`,
        pitchClass: latticePitchClass(p),
        world: latticeToWorld(p),
    };
}

function edgeOf(from: LatticePoint, to: LatticePoint): TonnetzEdge {
    const fromNode = nodeAt(from);
    const toNode = nodeAt(to);
    return { key: `${fromNode.key}:${toNode.key}`, from: fromNode, to: toNode };
}

function triangleOf(tri: TriangleId): TonnetzTriangle {
    const vertices = triangleLatticeVertices(tri).map(nodeAt) as [TonnetzNode, TonnetzNode, TonnetzNode];
    return {
        key: `${tri.fifths},${tri.thirds},${tri.mode}`,
        triad: triangleTriad(tri),
        vertices,
        incenter: triangleIncenter(tri),
    };
}

// rect内(境界含む)のノードと、rectと(部分的にでも)重なる辺・三角形を列挙する
export function tonnetzView(rect: Rect): TonnetzView {
    const bounds = latticeBoundsOfRect(rect);

    const nodes: TonnetzNode[] = [];
    for (let t = bounds.minT; t <= bounds.maxT; t++) {
        for (let f = bounds.minF; f <= bounds.maxF; f++) {
            const p = latticePoint(f, t);
            if (rectContains(rect, latticeToWorld(p))) nodes.push(nodeAt(p));
        }
    }

    const edges: TonnetzEdge[] = [];
    for (let t = bounds.minT - 1; t <= bounds.maxT + 1; t++) {
        for (let f = bounds.minF - 1; f <= bounds.maxF + 1; f++) {
            for (const direction of EDGE_DIRECTIONS) {
                const from = latticePoint(f, t);
                const to = latticePoint(f + direction.fifths, t + direction.thirds);
                const bbox = boundsOfPoints([latticeToWorld(from), latticeToWorld(to)]);
                if (rectsOverlap(rect, bbox)) edges.push(edgeOf(from, to));
            }
        }
    }

    const triangles: TonnetzTriangle[] = [];
    for (let t = bounds.minT - 1; t <= bounds.maxT; t++) {
        for (let f = bounds.minF - 1; f <= bounds.maxF; f++) {
            for (const mode of allModes) {
                const tri: TriangleId = { fifths: f, thirds: t, mode };
                const bbox = boundsOfPoints(triangleLatticeVertices(tri).map(latticeToWorld));
                if (rectsOverlap(rect, bbox)) triangles.push(triangleOf(tri));
            }
        }
    }

    return { nodes, edges, triangles };
}

// --- 公開: ヒットテスト(ワールド座標の一点の解釈) ---

// ワールド座標wに最も近い格子点。wを含むセルの4隅のうち最近傍を返す
function nearestLatticePoint(w: Vec2): LatticePoint {
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

// ワールド座標wに内心が最も近い三角形。modeを指定するとそのモードの三角形に限定する。
// 三角形タイリングに対して内心がつくるボロノイ分割はもとの三角形分割とほぼ一致するため、
// モード指定なしでは「wを含む三角形」とほぼ同じ結果になり、クリック判定はこちらに一本化できる
function nearestTriangleId(w: Vec2, mode?: Mode): TriangleId {
    const l = worldToLattice(w);
    const f = Math.floor(l.x);
    const t = Math.floor(l.y);
    const candidates: TriangleId[] = [];
    for (let df = -1; df <= 1; df++) {
        for (let dt = -1; dt <= 1; dt++) {
            for (const m of allModes) {
                if (mode !== undefined && m !== mode) continue;
                candidates.push({ fifths: f + df, thirds: t + dt, mode: m });
            }
        }
    }
    return candidates.reduce((best, tri) =>
        distance(triangleIncenter(tri), w) < distance(triangleIncenter(best), w) ? tri : best
    );
}

// ワールド座標の一点の解釈結果。最寄りノードを使う操作(スケールのスナップや構成音のトグル)と
// 三角形を使う操作(トライアドの選択)の両方に足りるだけの情報を持たせ、使い分けは呼び出し側に委ねる
export type TonnetzHit = {
    // 生のワールド座標。呼び出し側が独自の判定(nearestTriadによるモード限定など)に使える
    readonly world: Vec2;
    // 最寄りのノード
    readonly node: TonnetzNode;
    // 最寄りのノードまでの距離(ワールド座標)。「ノードの上かどうか」の判定は
    // 描画側の半径に依存するため、距離だけを渡して判定は呼び出し側で行う
    readonly nodeDistance: number;
    // 内心が最も近い三角形のトライアド
    readonly triad: Triad;
};

export function tonnetzHit(world: Vec2): TonnetzHit {
    const node = nodeAt(nearestLatticePoint(world));
    return {
        world,
        node,
        nodeDistance: distance(world, node.world),
        triad: triangleTriad(nearestTriangleId(world)),
    };
}

// ワールド座標wに(内心が)最も近い、指定モードのトライアド。
// quickモードの「クオリティに合うトライアドへのスナップ」などに使う
export function nearestTriad(world: Vec2, mode?: Mode): Triad {
    return triangleTriad(nearestTriangleId(world, mode));
}
