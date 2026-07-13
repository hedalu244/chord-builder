import { CSSProperties, PointerEvent, useRef, useState } from "react";
import { PitchClass } from "../../basics/pitch";
import { Triad } from "../../basics/triad";
import {
	edgesInRect, LatticeEdge, latticePitchClass, LatticePoint, latticePointsInRect, latticeToWorld,
	nearestLatticePoint, nearestTriangle, TonnetzTriangle, triangleIncenter, trianglesInRect,
	triangleTriad, triangleVertices,
} from "../../basics/tonnetz";
import { add, expandRect, Rect, scale, sub, Vec2, vec2 } from "../../basics/vec2";

// 1格子単位(完全五度)あたりの描画ピクセル数と、viewBoxの論理サイズ
const UNIT = 64;
const VIEW_WIDTH = 520;
const VIEW_HEIGHT = 400;
const NODE_RADIUS = 13;
// クリック位置がこの半径の内側ならノードへの操作、外側なら三角形への操作とみなす(円より少し甘め)
const NODE_HIT_RADIUS = NODE_RADIUS + 3;
// この距離(クライアントpx)を超えて動いたら、クリックではなくパン(スクロール)とみなす
const DRAG_THRESHOLD = 5;
// 表示範囲の外縁にかかる要素(円の一部だけ見える格子点など)を拾うためのマージン(格子単位)
const VIEW_MARGIN = NODE_RADIUS / UNIT + 0.05;

// 強調表示の1レイヤ。ピッチクラス/トライアド単位で指定し、無限平面上に周期的に現れる
// 該当箇所すべてに適用される。classNameは tonnetz__node--{className} などのCSSクラスに展開される
export type TonnetzLayer = {
	readonly className: string;
	// 強調するノード
	readonly pitchClasses?: readonly PitchClass[];
	// trueなら、強調ノード同士が隣接している辺も強調する(スケールやコードの形の表示に使う)。
	// 強調された辺の下にはデフォルトの格子線を描かない(半透明の強調線が背景線と二重に見えないように)
	readonly connect?: boolean;
	// trueなら、3頂点すべてが強調ノードに含まれる三角形も塗る(スケールに含まれるトライアドの表示に使う)
	readonly fillContained?: boolean;
	// 強調する三角形
	readonly triads?: readonly Triad[];
};

// クリック/ホバー位置の解釈結果。ノード上かどうかの使い分け(コード選択)も、
// 常に最寄りノードを使う使い方(スケールのスナップ)も、呼び出し側で選べるように両方を持たせる。
// worldは生のワールド座標(格子単位)で、呼び出し側が独自の判定(モード限定の最寄り三角形など)に使える
export type TonnetzTarget = {
	readonly world: Vec2;
	readonly nearestPoint: LatticePoint;
	readonly nearestPitchClass: PitchClass;
	readonly onNode: boolean;
	readonly triangle: TonnetzTriangle;
	readonly triad: Triad;
};

type TonnetzProps = {
	// 下に指定されたものから順に重ねて描画される
	readonly layers: readonly TonnetzLayer[];
	// trueなら各三角形の重心にトライアド名(C/Cmなど)を表示する(コード選択UI向け)
	readonly showTriadLabels?: boolean;
	// クリック(パンを伴わないポインタ操作)時に呼ばれる
	readonly onTap?: (target: TonnetzTarget) => void;
	// ポインタ移動のたびに呼ばれる。図から離れたときはnull
	readonly onHover?: (target: TonnetzTarget | null) => void;
};

type DragState = {
	readonly pointerId: number;
	readonly startClient: Vec2;
	readonly startViewMin: Vec2;
	moved: boolean;
};

// ピッチクラスごとの配色をCSS変数として要素に注入し、具体的な使い方はCSS側に委ねる
function pitchClassColorVars(value: number): CSSProperties {
	return {
		"--pc-light": `var(--pc-${value}-light)`,
		"--pc-basic": `var(--pc-${value}-basic)`,
		"--pc-dark": `var(--pc-${value}-dark)`,
	} as CSSProperties;
}

function pointKey(p: LatticePoint): string {
	return `${p.fifths},${p.thirds}`;
}

function edgeKey(edge: LatticeEdge): string {
	return `${pointKey(edge.from)}:${pointKey(edge.to)}`;
}

function triangleKey(tri: TonnetzTriangle): string {
	return `${tri.fifths},${tri.thirds},${tri.mode}`;
}

function toPx(p: LatticePoint): Vec2 {
	return scale(latticeToWorld(p), UNIT);
}

function trianglePointsAttr(tri: TonnetzTriangle): string {
	return triangleVertices(tri).map(toPx).map(v => `${v.x},${v.y}`).join(" ");
}

// クライアント座標をワールド座標(格子単位)に変換する。svgはCSSでアスペクト比が保たれている前提
function clientToWorld(svg: SVGSVGElement, clientX: number, clientY: number, viewMin: Vec2): Vec2 {
	const rect = svg.getBoundingClientRect();
	const px = vec2(
		viewMin.x + (clientX - rect.left) * VIEW_WIDTH / rect.width,
		viewMin.y + (clientY - rect.top) * VIEW_HEIGHT / rect.height
	);
	return scale(px, 1 / UNIT);
}

function targetAt(world: Vec2): TonnetzTarget {
	const nearestPoint = nearestLatticePoint(world);
	const offset = sub(scale(world, UNIT), toPx(nearestPoint));
	// 三角形の判定は「内心が最も近い三角形」に一本化(内心のボロノイ分割≒三角形分割)
	const triangle = nearestTriangle(world);
	return {
		world,
		nearestPoint,
		nearestPitchClass: latticePitchClass(nearestPoint),
		onNode: Math.hypot(offset.x, offset.y) <= NODE_HIT_RADIUS,
		triangle,
		triad: triangleTriad(triangle),
	};
}

export function Tonnetz(props: TonnetzProps) {
	const { layers, showTriadLabels, onTap, onHover } = props;
	// viewBoxの左上のワールド座標(px単位)。初期状態は原点(C)が中央に来る位置
	const [viewMin, setViewMin] = useState<Vec2>(() => vec2(-VIEW_WIDTH / 2, -VIEW_HEIGHT / 2));
	const dragRef = useRef<DragState | null>(null);

	const handlePointerDown = (event: PointerEvent<SVGSVGElement>): void => {
		if (!event.isPrimary) return;
		event.currentTarget.setPointerCapture(event.pointerId);
		dragRef.current = {
			pointerId: event.pointerId,
			startClient: vec2(event.clientX, event.clientY),
			startViewMin: viewMin,
			moved: false,
		};
	};

	const handlePointerMove = (event: PointerEvent<SVGSVGElement>): void => {
		const drag = dragRef.current;
		if (drag && drag.pointerId === event.pointerId) {
			const deltaClient = sub(vec2(event.clientX, event.clientY), drag.startClient);
			if (Math.hypot(deltaClient.x, deltaClient.y) > DRAG_THRESHOLD) {
				drag.moved = true;
			}
			if (drag.moved) {
				const rect = event.currentTarget.getBoundingClientRect();
				setViewMin(sub(drag.startViewMin, scale(deltaClient, VIEW_WIDTH / rect.width)));
				return;
			}
		}
		onHover?.(targetAt(clientToWorld(event.currentTarget, event.clientX, event.clientY, viewMin)));
	};

	const handlePointerUp = (event: PointerEvent<SVGSVGElement>): void => {
		const drag = dragRef.current;
		if (!drag || drag.pointerId !== event.pointerId) return;
		dragRef.current = null;
		if (!drag.moved) {
			onTap?.(targetAt(clientToWorld(event.currentTarget, event.clientX, event.clientY, viewMin)));
		}
	};

	const handlePointerCancel = (): void => {
		dragRef.current = null;
		onHover?.(null);
	};

	const handlePointerLeave = (): void => {
		onHover?.(null);
	};

	// 表示範囲(+マージン)をワールド座標の矩形として求め、描画対象の格子要素を有限化する
	const viewRect: Rect = expandRect({
		min: scale(viewMin, 1 / UNIT),
		max: scale(add(viewMin, vec2(VIEW_WIDTH, VIEW_HEIGHT)), 1 / UNIT),
	}, VIEW_MARGIN);
	const points = latticePointsInRect(viewRect);
	const edges = edgesInRect(viewRect);
	const triangles = trianglesInRect(viewRect);

	// レイヤごとの照合用集合を先に作っておく
	const layerData = layers.map(layer => ({
		layer,
		pcValues: new Set((layer.pitchClasses ?? []).map(pc => pc.value)),
		triadKeys: new Set((layer.triads ?? []).map(triad => triad.toString())),
	}));

	const isConnectedEdge = (pcValues: ReadonlySet<number>, edge: LatticeEdge): boolean =>
		pcValues.has(latticePitchClass(edge.from).value) && pcValues.has(latticePitchClass(edge.to).value);

	// いずれかのレイヤの強調線に覆われる辺。デフォルトの格子線の描画から除外する
	const coveredEdgeKeys = new Set(
		layerData
			.filter(({ layer }) => layer.connect)
			.flatMap(({ pcValues }) => edges.filter(edge => isConnectedEdge(pcValues, edge)).map(edgeKey))
	);

	// レイヤが塗る三角形: 明示指定(triads)と、fillContained時の「3頂点すべてが強調ノード」の三角形
	const highlightTriangles = (data: (typeof layerData)[number]): TonnetzTriangle[] => {
		const { layer, pcValues, triadKeys } = data;
		return triangles.filter(tri =>
			triadKeys.has(triangleTriad(tri).toString()) ||
			(layer.fillContained === true &&
				triangleVertices(tri).every(vertex => pcValues.has(latticePitchClass(vertex).value)))
		);
	};

	return (
		<svg
			className="tonnetz"
			viewBox={`${viewMin.x} ${viewMin.y} ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerCancel}
			onPointerLeave={handlePointerLeave}
		>
			{/* fillとstrokeは別で管理する: すべての塗り(三角形)をレイヤ順に描いたあと、
			    すべての線(格子線→強調線)を上に重ねる。塗りが線を隠さないようにするため。
			    ノードの強調はノード自身へのクラス付与で行う */}
			{layerData.map((data, layerIndex) => (
				<g key={layerIndex}>
					{highlightTriangles(data).map(tri => (
						<polygon
							key={triangleKey(tri)}
							className={`tonnetz__triangle-highlight tonnetz__triangle-highlight--${data.layer.className}`}
							style={pitchClassColorVars(triangleTriad(tri).root.value)}
							points={trianglePointsAttr(tri)}
						/>
					))}
				</g>
			))}
			{/* 背景の格子線。三角形と逆三角形の区別は形状から自明なため、背景の塗り分けはしない。
			    強調線に覆われる辺は描かない(排他) */}
			{edges.filter(edge => !coveredEdgeKeys.has(edgeKey(edge))).map(edge => {
				const from = toPx(edge.from);
				const to = toPx(edge.to);
				return (
					<line
						key={edgeKey(edge)}
						className="tonnetz__edge"
						x1={from.x} y1={from.y} x2={to.x} y2={to.y}
					/>
				);
			})}
			{/* 強調線(スケールの形・構成音の連結など) */}
			{layerData.map((data, layerIndex) => (
				<g key={layerIndex}>
					{data.layer.connect && edges
						.filter(edge => isConnectedEdge(data.pcValues, edge))
						.map(edge => {
							const from = toPx(edge.from);
							const to = toPx(edge.to);
							return (
								<line
									key={edgeKey(edge)}
									className={`tonnetz__edge-highlight tonnetz__edge-highlight--${data.layer.className}`}
									x1={from.x} y1={from.y} x2={to.x} y2={to.y}
								/>
							);
						})}
				</g>
			))}
			{/* トライアド名ラベル(各三角形の内心) */}
			{showTriadLabels && triangles.map(tri => {
				const centroid = scale(triangleIncenter(tri), UNIT);
				return (
					<text
						key={triangleKey(tri)}
						className="tonnetz__triangle-label"
						x={centroid.x}
						y={centroid.y}
					>
						{triangleTriad(tri).toString()}
					</text>
				);
			})}
			{/* ノード(円と音名ラベル) */}
			{points.map(p => {
				const pitchClass = latticePitchClass(p);
				const pos = toPx(p);
				const classNames = [
					"tonnetz__node",
					...layerData
						.filter(({ pcValues }) => pcValues.has(pitchClass.value))
						.map(({ layer }) => `tonnetz__node--${layer.className}`),
				];
				return (
					<g key={pointKey(p)} className={classNames.join(" ")} style={pitchClassColorVars(pitchClass.value)}>
						<circle cx={pos.x} cy={pos.y} r={NODE_RADIUS} />
						<text x={pos.x} y={pos.y}>{pitchClass.toString()}</text>
					</g>
				);
			})}
		</svg>
	);
}
