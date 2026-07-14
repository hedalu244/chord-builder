import { useState } from "react";
import { Chord } from "../basics/chord";
import { ScaleInfo } from "../basics/scaleInfo";
import { ParentScaleID, contextScaleNames } from "../basics/scaleDictionary";
import { PitchClass } from "../basics/pitch";
import { ScaleContextStrip, ContextPosition, ContextVisibility } from "./parts/contextStrip";
import { Modal } from "./parts/modal";
import { Tonnetz, TonnetzTarget } from "./parts/tonnetz";
import { chordLayer, contextEmphasis, currentEmphasis, scaleLayer, TonnetzLayer } from "./parts/tonnetzLayer";

type ContextScaleModalProps = {
	readonly value: ScaleInfo;
	// 参照表示用: このcontextScaleの前後のコードと、さらにその外側のcontextScale。
	// コードとスケールの立ち位置がChordModalと逆になる(スケールが主役で、コードがその間にある)
	readonly formerChord?: Chord;
	readonly latterChord?: Chord;
	readonly formerScale?: ScaleInfo;
	readonly latterScale?: ScaleInfo;
	readonly onConfirm: (contextScale: ScaleInfo) => void;
	readonly onCancel: () => void;
};

// スケール名はプルダウンで選び、key(スケールを置く位置)はトネッツ図上で選ぶ。
// keyのプルダウンも同等の操作として残してある
export function ContextScaleModal(props: ContextScaleModalProps) {
	const { value, formerChord, latterChord, formerScale, latterScale, onConfirm, onCancel } = props;
	// 編集中のスケール
	const [current, setCurrent] = useState<ScaleInfo>(value);

	const [stripVisibility, setStripVisibility] = useState<ContextVisibility>({
		"former-scale": false,
		"latter-scale": false,
		"former-chord": true,
		"latter-chord": true,
		"current": true,
	});

	// ホバー中の最寄り頂点のピッチクラス値。クリックでkeyになる位置のプレビュー(薄表示)に使う
	const [hoverKeyValue, setHoverKeyValue] = useState<number | null>(null);
	const [stripHoverPosition, setStripHoverPosition] = useState<ContextPosition | "current" | undefined>(undefined);

	const setKey = (key: PitchClass): void => setCurrent(new ScaleInfo(key, current.parentScale, 0));
	const setName = (name: ParentScaleID): void => setCurrent(new ScaleInfo(current.key, name, 0));
	const hoverScale =
		hoverKeyValue !== null && hoverKeyValue !== current.key.value
			? new ScaleInfo(new PitchClass(hoverKeyValue), current.parentScale, 0)
			: undefined;

	// Emphasisのルール:
	// - former/latterのchordはvisibleならnormal(このモーダルではコードが参照の主役)、scaleはvisibleならfaint(backdrop)。
	//   contextStrip上でhoverされている間はnormal。visibleでなければhidden
	// - 編集中のcurrentScaleは常にfaint。hoverScale(トネッツ上のクリック結果のプレビュー)もfaintで、
	//   両方ある間は重ねて表示する
	const formerScaleEmphasis = contextEmphasis("former-scale", stripHoverPosition, stripVisibility, "faint");
	const latterScaleEmphasis = contextEmphasis("latter-scale", stripHoverPosition, stripVisibility, "faint");
	const formerChordEmphasis = contextEmphasis("former-chord", stripHoverPosition, stripVisibility, "normal");
	const latterChordEmphasis = contextEmphasis("latter-chord", stripHoverPosition, stripVisibility, "normal");
	const layers: TonnetzLayer[] = [
		scaleLayer(formerScale, formerScaleEmphasis === "faint" ? "backdrop" : "hidden"),
		scaleLayer(latterScale, latterScaleEmphasis === "faint" ? "backdrop" : "hidden"),
		scaleLayer(hoverScale, "faint"),
		scaleLayer(current, currentEmphasis(stripHoverPosition, "faint")),
		scaleLayer(formerScale, formerScaleEmphasis === "normal" ? "normal" : "hidden"),
		scaleLayer(latterScale, latterScaleEmphasis === "normal" ? "normal" : "hidden"),
		chordLayer(formerChord, formerChordEmphasis),
		chordLayer(latterChord, latterChordEmphasis),
	];

	const handleHover = (target: TonnetzTarget | null): void => {
		setHoverKeyValue(target === null ? null : target.node.pitchClass.value);
	};

	return (
		<Modal className="context-scale-modal" title="Edit Context Scale" onCancel={onCancel} onConfirm={() => onConfirm(current)}>
			<div className="modal-split">
				<div className="modal-split__tonnetz-pane">
					<Tonnetz
						layers={layers}
						onTap={target => setKey(target.node.pitchClass)}
						onHover={handleHover}
					/>
				</div>
				<div className="modal-split__detail-pane">
					<ScaleContextStrip
						formerChord={formerChord}
						latterChord={latterChord}
						formerScale={formerScale}
						currentScale={current}
						latterScale={latterScale}
						visibility={stripVisibility}
						onVisibilityChange={setStripVisibility}
						onHoverChange={setStripHoverPosition}
					/>
					<div className="context-scale-modal__controls">
						<select
							value={String(current.key.value)}
							onChange={event => setKey(PitchClass.all[Number(event.target.value)])}
						>
							{PitchClass.all.map(pc => (
								<option key={pc.value} value={pc.value}>{pc.toString()}</option>
							))}
						</select>
						<select
							value={current.parentScale}
							onChange={event => setName(contextScaleNames[event.target.selectedIndex])}
						>
							{contextScaleNames.map(scaleName => (
								<option key={scaleName} value={scaleName}>{scaleName}</option>
							))}
						</select>
					</div>
					<p className="modal-split__hint">
						Click anywhere on the Tonnetz to move the scale to the nearest key.
					</p>
				</div>
			</div>
		</Modal>
	);
}
