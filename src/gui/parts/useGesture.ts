import { PointerEvent, useRef } from "react";
import { sub, Vec2, vec2 } from "../../basics/math/vec2";

// SVG上のポインタイベント列を「パン」「タップ」「ホバー」のジェスチャに分類し、
// 事前登録されたコールバックへ振り分けるフック。座標はクライアント座標のまま渡し、
// その解釈(viewBox座標への変換など)は呼び出し側に委ねる。

// この距離(クライアントpx)を超えて動いたら、タップではなくパンとみなす
const DRAG_THRESHOLD = 5;

type DragState = {
	readonly pointerId: number;
	readonly startClient: Vec2;
	lastClient: Vec2;
	moved: boolean;
};

export type GestureHandlers = {
	readonly onPointerDown: (event: PointerEvent<SVGSVGElement>) => void;
	readonly onPointerMove: (event: PointerEvent<SVGSVGElement>) => void;
	readonly onPointerUp: (event: PointerEvent<SVGSVGElement>) => void;
	readonly onPointerCancel: () => void;
	readonly onPointerLeave: () => void;
};

type GestureCallbacks = {
	// パン中のポインタ移動のたびに、前回位置からの移動量(クライアントpx)で呼ばれる
	readonly onPan?: (deltaClient: Vec2, svg: SVGSVGElement) => void;
	// タップ(パンを伴わないポインタ操作)時に呼ばれる
	readonly onTap?: (client: Vec2, svg: SVGSVGElement) => void;
	// ポインタ移動のたびに呼ばれる(パン中を除く)。図から離れたときはnull
	readonly onHover?: (client: Vec2 | null, svg: SVGSVGElement | null) => void;
};

export function useGesture(callbacks: GestureCallbacks): GestureHandlers {
	const { onPan, onTap, onHover } = callbacks;
	const dragRef = useRef<DragState | null>(null);

	return {
		onPointerDown: event => {
			if (!event.isPrimary) return;
			event.currentTarget.setPointerCapture(event.pointerId);
			const client = vec2(event.clientX, event.clientY);
			dragRef.current = {
				pointerId: event.pointerId,
				startClient: client,
				lastClient: client,
				moved: false,
			};
		},
		onPointerMove: event => {
			const client = vec2(event.clientX, event.clientY);
			const drag = dragRef.current;
			if (drag && drag.pointerId === event.pointerId) {
				const fromStart = sub(client, drag.startClient);
				if (Math.hypot(fromStart.x, fromStart.y) > DRAG_THRESHOLD) {
					drag.moved = true;
				}
				if (drag.moved) {
					onPan?.(sub(client, drag.lastClient), event.currentTarget);
					drag.lastClient = client;
					return;
				}
			}
			onHover?.(client, event.currentTarget);
		},
		onPointerUp: event => {
			const drag = dragRef.current;
			if (!drag || drag.pointerId !== event.pointerId) return;
			dragRef.current = null;
			if (!drag.moved) {
				onTap?.(vec2(event.clientX, event.clientY), event.currentTarget);
			}
		},
		onPointerCancel: () => {
			dragRef.current = null;
			onHover?.(null, null);
		},
		onPointerLeave: () => {
			onHover?.(null, null);
		},
	};
}
