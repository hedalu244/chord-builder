import { ReactNode } from "react";
import { VisibilityToggle } from "./visibilityToggle";
import { Chord } from "../../basics/chord";
import { ScaleInfo } from "../../basics/scaleInfo";
import { ChordNotation } from "./chordNotation";

// コンテキスト帯: モーダル上部で編集対象の前後関係を示す5マスのグリッド。
// 上段2マス・下段3マス(左・中央(編集対象)・右)からなる。コード/スケールのどちらを
// どの段に置くかはモーダルごとに逆になるため、ここはマスの構造だけを提供し、中身は呼び出し側が与える。
// visibilityは呼び出し側が保持する単一の正データで、ここは表示とトグル・ホバーの通知のみを担う。

export type ContextPosition = "former-scale" | "latter-scale" | "former-chord" | "latter-chord";
export type ContextVisibility = Record<ContextPosition, boolean>;
const overlayLabels: Record<ContextPosition, string> = {
	"former-scale": "former context scale",
	"latter-scale": "latter context scale",
	"former-chord": "former chord",
	"latter-chord": "latter chord",
};

type ContextStripCellProps = {
	readonly slot: string;
	readonly content: ReactNode;
	readonly position?: ContextPosition;
	readonly visible?: boolean;
	readonly onToggle?: () => void;
	readonly onHover?: (position: ContextPosition | undefined) => void;
};

function ContextStripCell(props: ContextStripCellProps) {
	const { slot, content, position, visible, onToggle, onHover } = props;
	const present = content != null;
	const canHover = onHover !== undefined && position !== undefined && present;
	return (
		<div
			className={`context-strip__cell context-strip__cell--${slot}`}
			onMouseEnter={canHover ? () => onHover!(position) : undefined}
			onMouseLeave={canHover ? () => onHover!(undefined) : undefined}
		>
			<div className="context-strip__value">{present ? content : "–"}</div>
			{position && present && onToggle && (
				<VisibilityToggle
					label={overlayLabels[position]}
					visible={visible ?? false}
					onToggle={onToggle}
				/>
			)}
		</div>
	);
}

type ChordContextStripProps = {
	readonly formerScale?: ScaleInfo;
	readonly latterScale?: ScaleInfo;
	readonly formerChord?: Chord;
	readonly currentChord?: Chord;
	readonly latterChord?: Chord;
	readonly visibility: ContextVisibility;
	readonly onVisibilityChange: (visibility: ContextVisibility) => void;
	readonly onHoverChange?: (position: ContextPosition | undefined) => void;
};

// 下段左右(left/right)は編集対象と同種の隣接物で、ホバーで主役と入れ替わるため onHover を渡す。
// 上段(異種)と中央(編集対象)は入れ替え対象外。
export function ChordContextStrip(props: ChordContextStripProps) {
	const { formerScale, latterScale, formerChord, currentChord, latterChord, visibility, onVisibilityChange, onHoverChange } = props;
	const notation = (chord?: Chord): ReactNode => chord && <ChordNotation chord={chord} />;
	const toggle = (position: ContextPosition) => (): void =>
		onVisibilityChange({ ...visibility, [position]: !visibility[position] });
	return (
		<div className="context-strip">
			<ContextStripCell slot="top-left" content={formerScale?.keyLabel()} position="former-scale" visible={visibility["former-scale"]} onToggle={toggle("former-scale")} />
			<ContextStripCell slot="top-right" content={latterScale?.keyLabel()} position="latter-scale" visible={visibility["latter-scale"]} onToggle={toggle("latter-scale")} />
			<ContextStripCell slot="left" content={notation(formerChord)} position="former-chord" visible={visibility["former-chord"]} onToggle={toggle("former-chord")} onHover={onHoverChange} />
			<ContextStripCell slot="current" content={notation(currentChord)} />
			<ContextStripCell slot="right" content={notation(latterChord)} position="latter-chord" visible={visibility["latter-chord"]} onToggle={toggle("latter-chord")} onHover={onHoverChange} />
		</div>
	);
}

type ScaleContextStripProps = {
	readonly formerChord?: Chord;
	readonly latterChord?: Chord;
	readonly formerScale?: ScaleInfo;
	readonly currentScale: ScaleInfo;
	readonly latterScale?: ScaleInfo;
	readonly visibility: ContextVisibility;
	readonly onVisibilityChange: (visibility: ContextVisibility) => void;
	readonly onHoverChange?: (position: ContextPosition | undefined) => void;
}

export function ScaleContextStrip(props: ScaleContextStripProps) {
	const { formerChord, latterChord, formerScale, currentScale, latterScale, visibility, onVisibilityChange, onHoverChange } = props;
	const degree = (chord?: Chord): string | undefined =>
		chord && chord.triad.degreeIn(currentScale.key).toString();
	const toggle = (position: ContextPosition) => (): void =>
		onVisibilityChange({ ...visibility, [position]: !visibility[position] });
	return (
		<div className="context-strip">
			<ContextStripCell slot="top-left" content={degree(formerChord)} position="former-chord" visible={visibility["former-chord"]} onToggle={toggle("former-chord")} />
			<ContextStripCell slot="top-right" content={degree(latterChord)} position="latter-chord" visible={visibility["latter-chord"]} onToggle={toggle("latter-chord")} />
			<ContextStripCell slot="left" content={formerScale?.keyLabel()} position="former-scale" visible={visibility["former-scale"]} onToggle={toggle("former-scale")} onHover={onHoverChange} />
			<ContextStripCell slot="current" content={currentScale.keyLabel()} />
			<ContextStripCell slot="right" content={latterScale?.keyLabel()} position="latter-scale" visible={visibility["latter-scale"]} onToggle={toggle("latter-scale")} onHover={onHoverChange} />
		</div>
	);
}
