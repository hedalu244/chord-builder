import { ReactNode } from "react";
import { VisibilityToggle } from "./visibilityToggle";
import { Chord } from "../../basics/chord";
import { ScaleInfo } from "../../basics/scaleInfo";
import { calcDegreeNexus, calcTriadDegree } from "../../basics/nexus";
import { ChordNotation } from "./chordNotation";

export type ContextPosition = "former-scale" | "latter-scale" | "former-chord" | "latter-chord" | "current";
export type ContextVisibility = Record<ContextPosition, boolean>;
const overlayLabels: Record<ContextPosition, string> = {
	"former-scale": "former context scale",
	"latter-scale": "latter context scale",
	"former-chord": "former chord",
	"latter-chord": "latter chord",
	"current": "current chord",
};

type ContextStripCellProps = {
	readonly content: ReactNode;
	readonly position: ContextPosition;
	readonly visible?: boolean;
	readonly onToggle?: () => void;
	readonly onHover?: (position: ContextPosition | undefined) => void;
	readonly role?: "edge" | "current";
};

function ContextStripCell(props: ContextStripCellProps) {
	const { content, position, visible, onToggle, onHover, role } = props;
	const present = content != null;
	const roleClassName = role ? ` context-strip__cell--${role}` : "";
	return (
		<div className={`context-strip__cell${roleClassName}`}>
			<div
				className="context-strip__value"
				onMouseEnter={onHover ? () => onHover(position) : undefined}
				onMouseLeave={onHover ? () => onHover(undefined) : undefined}
			>
				{present ? content : "–"}
			</div>
			<div className="context-strip__toggle">
				{present && position !== "current" && onToggle && <VisibilityToggle label={overlayLabels[position]} visible={!!visible} onToggle={onToggle} />}
			</div>
		</div>
	);
}

function secondaryWithAnnotation(value: ReactNode, annotation: ReactNode): ReactNode {
	return (
		<>
			<div className="context-strip__secondary-value">{value}</div>
			<div className="context-strip__annotation">{annotation}</div>
		</>
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

function scaleWithNexus(former: Chord | undefined, latter: Chord | undefined, scaleInfo: ScaleInfo | undefined): ReactNode {
	if (!scaleInfo) return undefined;
	const nexus = former && latter ? calcDegreeNexus(former.triad, latter.triad, scaleInfo) : undefined;
	return secondaryWithAnnotation(scaleInfo.keyLabel(), nexus ? nexus.toString() : "–");
}

export function ChordContextStrip(props: ChordContextStripProps) {
	const { formerScale, latterScale, formerChord, currentChord, latterChord, visibility, onVisibilityChange, onHoverChange } = props;
	const notation = (chord?: Chord): ReactNode => chord && <ChordNotation chord={chord} />;
	const toggle = (position: ContextPosition) => (): void =>
		onVisibilityChange({ ...visibility, [position]: !visibility[position] });
	return (
		<div className="context-strip">
			<div className="context-strip__row context-strip__row--double">
				<ContextStripCell content={scaleWithNexus(formerChord, currentChord, formerScale)} position="former-scale" visible={visibility["former-scale"]} onToggle={toggle("former-scale")} onHover={onHoverChange} />
				<ContextStripCell content={scaleWithNexus(currentChord, latterChord, latterScale)} position="latter-scale" visible={visibility["latter-scale"]} onToggle={toggle("latter-scale")} onHover={onHoverChange} />
			</div>
			<div className="context-strip__row context-strip__row--triple">
				<ContextStripCell role="edge" content={notation(formerChord)} position="former-chord" visible={visibility["former-chord"]} onToggle={toggle("former-chord")} onHover={onHoverChange} />
				<ContextStripCell role="current" content={notation(currentChord)} position="current" onHover={onHoverChange} />
				<ContextStripCell role="edge" content={notation(latterChord)} position="latter-chord" visible={visibility["latter-chord"]} onToggle={toggle("latter-chord")} onHover={onHoverChange} />
			</div>
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

function chordWithDegree(chord: Chord | undefined, currentScale: ScaleInfo): ReactNode {
	if (!chord) return undefined;
	return secondaryWithAnnotation(<ChordNotation chord={chord} />, calcTriadDegree(chord.triad, currentScale).toString());
}

export function ScaleContextStrip(props: ScaleContextStripProps) {
	const { formerChord, latterChord, formerScale, currentScale, latterScale, visibility, onVisibilityChange, onHoverChange } = props;
	const toggle = (position: ContextPosition) => (): void =>
		onVisibilityChange({ ...visibility, [position]: !visibility[position] });
	return (
		<div className="context-strip">
			<div className="context-strip__row context-strip__row--triple">
				<ContextStripCell role="edge" content={formerScale?.keyLabel()} position="former-scale" visible={visibility["former-scale"]} onToggle={toggle("former-scale")} onHover={onHoverChange} />
				<ContextStripCell role="current" content={currentScale.keyLabel()} position="current" onHover={onHoverChange} />
				<ContextStripCell role="edge" content={latterScale?.keyLabel()} position="latter-scale" visible={visibility["latter-scale"]} onToggle={toggle("latter-scale")} onHover={onHoverChange} />
			</div>
			<div className="context-strip__row context-strip__row--double">
				<ContextStripCell content={chordWithDegree(formerChord, currentScale)} position="former-chord" visible={visibility["former-chord"]} onToggle={toggle("former-chord")} onHover={onHoverChange} />
				<ContextStripCell content={chordWithDegree(latterChord, currentScale)} position="latter-chord" visible={visibility["latter-chord"]} onToggle={toggle("latter-chord")} onHover={onHoverChange} />
			</div>
		</div>
	);
}
