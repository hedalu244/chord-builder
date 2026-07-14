import { CSSProperties, useState } from "react";
import {
	TonnetzEdge, TonnetzHit, tonnetzHit, TonnetzTriangle, tonnetzView,
} from "../../basics/tonnetz";
import { expandRect, Rect } from "../../basics/math/geometry";
import { add, scale, sub, Vec2, vec2 } from "../../basics/math/vec2";
import { TonnetzLayer } from "./tonnetzLayer";
import { useGesture } from "./useGesture";

// 1格子単位(完全五度)あたりの描画ピクセル数と、viewBoxの論理サイズ
const UNIT = 64;
const VIEW_WIDTH = 520;
const VIEW_HEIGHT = 400;
const NODE_RADIUS = 13;
// クリック位置がこの半径の内側ならノードへの操作、外側なら三角形への操作とみなす(円より少し甘め)
const NODE_HIT_RADIUS = NODE_RADIUS + 3;
// 表示範囲の外縁にかかる要素(円の一部だけ見える格子点など)を拾うためのマージン(格子単位)
const VIEW_MARGIN = NODE_RADIUS / UNIT + 0.05;

// クリック/ホバー位置の解釈結果。tonnetzHitの解釈に、この図の描画半径に基づく
// 「ノードの上かどうか」(コード選択での使い分けに使う)を加えたもの
export type TonnetzTarget = TonnetzHit & {
	readonly onNode: boolean;
};

type TonnetzProps = {
	// 下に指定されたものから順に重ねて描画される
	readonly layers: readonly TonnetzLayer[];
	// trueなら各三角形の内心にトライアド名(C/Cmなど)を表示する(コード選択UI向け)
	readonly showTriadLabels?: boolean;
	// クリック(パンを伴わないポインタ操作)時に呼ばれる
	readonly onTap?: (target: TonnetzTarget) => void;
	// ポインタ移動のたびに呼ばれる。図から離れたときはnull
	readonly onHover?: (target: TonnetzTarget | null) => void;
};

// ピッチクラスごとの配色をCSS変数として要素に注入し、具体的な使い方はCSS側に委ねる
function pitchClassColorVars(value: number): CSSProperties {
	return {
		"--pc-light": `var(--pc-${value}-light)`,
		"--pc-basic": `var(--pc-${value}-basic)`,
		"--pc-dark": `var(--pc-${value}-dark)`,
	} as CSSProperties;
}

// ワールド座標(格子単位)をviewBoxのピクセル座標に変換する
function toPx(world: Vec2): Vec2 {
	return scale(world, UNIT);
}

function trianglePointsAttr(tri: TonnetzTriangle): string {
	return tri.vertices.map(vertex => toPx(vertex.world)).map(v => `${v.x},${v.y}`).join(" ");
}

// クライアント座標をワールド座標(格子単位)に変換する。svgはCSSでアスペクト比が保たれている前提
function clientToWorld(svg: SVGSVGElement, client: Vec2, viewMin: Vec2): Vec2 {
	const rect = svg.getBoundingClientRect();
	const px = vec2(
		viewMin.x + (client.x - rect.left) * VIEW_WIDTH / rect.width,
		viewMin.y + (client.y - rect.top) * VIEW_HEIGHT / rect.height
	);
	return scale(px, 1 / UNIT);
}

function targetAt(world: Vec2): TonnetzTarget {
	const hit = tonnetzHit(world);
	return { ...hit, onNode: hit.nodeDistance * UNIT <= NODE_HIT_RADIUS };
}

export function Tonnetz(props: TonnetzProps) {
	const { layers, showTriadLabels, onTap, onHover } = props;
	// viewBoxの左上のワールド座標(px単位)。初期状態は原点(C)が中央に来る位置
	const [viewMin, setViewMin] = useState<Vec2>(() => vec2(-VIEW_WIDTH / 2, -VIEW_HEIGHT / 2));

	const gestureHandlers = useGesture({
		onPan: (deltaClient, svg) => {
			const rect = svg.getBoundingClientRect();
			setViewMin(min => sub(min, scale(deltaClient, VIEW_WIDTH / rect.width)));
		},
		onTap: (client, svg) => onTap?.(targetAt(clientToWorld(svg, client, viewMin))),
		onHover: (client, svg) =>
			onHover?.(client && svg ? targetAt(clientToWorld(svg, client, viewMin)) : null),
	});

	// 表示範囲(+マージン)をワールド座標の矩形として求め、描画対象の格子要素を有限化する
	const viewRect: Rect = expandRect({
		min: scale(viewMin, 1 / UNIT),
		max: scale(add(viewMin, vec2(VIEW_WIDTH, VIEW_HEIGHT)), 1 / UNIT),
	}, VIEW_MARGIN);
	const { nodes, edges, triangles } = tonnetzView(viewRect);

	const layerData = layers
		.filter(layer => layer.className !== "hidden")
		.map(layer => ({
			layer,
			pcValues: new Set((layer.pitchClasses ?? []).map(pc => pc.value)),
			triadKeys: new Set((layer.triads ?? []).map(triad => triad.toString())),
			ringValues: new Set((layer.rings ?? []).map(pc => pc.value)),
		}));

	const isConnectedEdge = (pcValues: ReadonlySet<number>, edge: TonnetzEdge): boolean =>
		pcValues.has(edge.from.pitchClass.value) && pcValues.has(edge.to.pitchClass.value);

	// いずれかのレイヤの強調線に覆われる辺。デフォルトの格子線の描画から除外する
	const coveredEdgeKeys = new Set(
		layerData
			.filter(({ layer }) => layer.connect)
			.flatMap(({ pcValues }) => edges.filter(edge => isConnectedEdge(pcValues, edge)).map(edge => edge.key))
	);

	const highlightTriangles = (data: (typeof layerData)[number]): TonnetzTriangle[] => {
		const { triadKeys } = data;
		return triangles.filter(tri => triadKeys.has(tri.triad.toString()));
	};

	return (
		<svg
			className="tonnetz"
			viewBox={`${viewMin.x} ${viewMin.y} ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
			{...gestureHandlers}
		>
			{/* fillとstrokeは別で管理する: すべての塗り(三角形)をレイヤ順に描いたあと、
			    すべての線(格子線→強調線)を上に重ねる。塗りが線を隠さないようにするため。
			    ノードの強調はノード自身へのクラス付与で行う */}
			{layerData.map((data, layerIndex) => (
				<g key={layerIndex}>
					{highlightTriangles(data).map(tri => (
						<polygon
							key={tri.key}
							className={`tonnetz__triangle-highlight tonnetz__triangle-highlight--${data.layer.className}`}
							style={pitchClassColorVars(tri.triad.root.value)}
							points={trianglePointsAttr(tri)}
						/>
					))}
				</g>
			))}
			{/* 背景の格子線。三角形と逆三角形の区別は形状から自明なため、背景の塗り分けはしない。
			    強調線に覆われる辺は描かない(排他) */}
			{edges.filter(edge => !coveredEdgeKeys.has(edge.key)).map(edge => {
				const from = toPx(edge.from.world);
				const to = toPx(edge.to.world);
				return (
					<line
						key={edge.key}
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
							const from = toPx(edge.from.world);
							const to = toPx(edge.to.world);
							return (
								<line
									key={edge.key}
									className={`tonnetz__edge-highlight tonnetz__edge-highlight--${data.layer.className}`}
									x1={from.x} y1={from.y} x2={to.x} y2={to.y}
								/>
							);
						})}
				</g>
			))}
			{/* トライアド名ラベル(各三角形の内心) */}
			{showTriadLabels && triangles.map(tri => {
				const center = toPx(tri.incenter);
				return (
					<text
						key={tri.key}
						className="tonnetz__triangle-label"
						x={center.x}
						y={center.y}
					>
						{tri.triad.toString()}
					</text>
				);
			})}
			{/* ノード(円と音名ラベル) */}
			{nodes.map(node => {
				const pos = toPx(node.world);
				const classNames = [
					"tonnetz__node",
					...layerData
						.filter(({ pcValues }) => pcValues.has(node.pitchClass.value))
						.map(({ layer }) => `tonnetz__node--${layer.className}`),
				];
				return (
					<g key={node.key} className={classNames.join(" ")} style={pitchClassColorVars(node.pitchClass.value)}>
						{/* 二重ボーダー(スケールの主音など): ストロークだけの円を外側に重ねる */}
						{layerData
							.map((data, layerIndex) => ({ data, layerIndex }))
							.filter(({ data }) => data.ringValues.has(node.pitchClass.value))
							.map(({ data, layerIndex }) => (
								<circle
									key={layerIndex}
									className={`tonnetz__node-ring tonnetz__node-ring--${data.layer.className}`}
									cx={pos.x} cy={pos.y} r={NODE_RADIUS + 3.5}
								/>
							))}
						<circle cx={pos.x} cy={pos.y} r={NODE_RADIUS} />
						<text x={pos.x} y={pos.y}>{node.pitchClass.toString()}</text>
					</g>
				);
			})}
		</svg>
	);
}
