import { useState } from "react";
import { Chord } from "../basics/chord";
import { ScaleInfo } from "../basics/scaleInfo";
import { ParentScaleID, contextScaleNames } from "../basics/scaleDictionary";
import { PitchClass } from "../basics/pitch";
import { ScaleContextStrip, ContextPosition, ContextVisibility } from "./parts/contextStrip";
import { Modal } from "./parts/modal";
import { Tonnetz, TonnetzTarget } from "./parts/tonnetz";
import { chordLayer, scaleBackdropLayer, scaleLayer, TonnetzLayer } from "./parts/tonnetzLayer";

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
	});

	// ホバー中の最寄り頂点のピッチクラス値。クリックでkeyになる位置のプレビュー(薄表示)に使う
	const [hoverKeyValue, setHoverKeyValue] = useState<number | null>(null);
	const [stripHoverPosition, setStripHoverPosition] = useState<ContextPosition | "current" | undefined>(undefined);

	const setKey = (key: PitchClass): void => setCurrent(new ScaleInfo(key, current.parentScale, 0));
	const setName = (name: ParentScaleID): void => setCurrent(new ScaleInfo(current.key, name, 0));

	// 前後のcontextScaleは背景として、前後のコードは薄いコード表示として敷き、編集中のスケール(normal)が
	// 常に主役として上に乗る。ただしコンテキスト帯で前後スケールをホバーしている間は主役を入れ替え、
	// 編集中を薄く落としてホバーされたスケールを通常表示する
	const layers: TonnetzLayer[] = [
		...(stripVisibility["former-scale"] && formerScale && stripHoverPosition !== "former-scale" ? [scaleBackdropLayer(formerScale)] : []),
		...(stripVisibility["latter-scale"] && latterScale && stripHoverPosition !== "latter-scale" ? [scaleBackdropLayer(latterScale)] : []),
		...(stripVisibility["former-chord"] && formerChord ? [chordLayer(formerChord, "faint")] : []),
		...(stripVisibility["latter-chord"] && latterChord ? [chordLayer(latterChord, "faint")] : []),
		// ホバー位置にスナップしたスケールの薄表示(クリック結果のプレビュー)
		...(hoverKeyValue !== null && hoverKeyValue !== current.key.value
			? [scaleLayer(new ScaleInfo(new PitchClass(hoverKeyValue), current.parentScale, 0), "faint")]
			: []),
		scaleLayer(current, stripHoverPosition === undefined ? "normal" : "faint"),
		...(formerScale && stripHoverPosition === "former-scale" ? [scaleLayer(formerScale, "normal")] : []),
		...(latterScale && stripHoverPosition === "latter-scale" ? [scaleLayer(latterScale, "normal")] : []),
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
