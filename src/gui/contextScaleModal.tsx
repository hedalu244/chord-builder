import { ReactNode, useState } from "react";
import { Chord } from "../basics/chord";
import { ContextScale, knownScaleNames } from "../basics/contextScale";
import { PitchClass } from "../basics/pitch";
import { DegreeTriad } from "../basics/triad";
import { Modal } from "./parts/modal";
import { OverlayToggle } from "./parts/overlayToggle";
import { Tonnetz, TonnetzLayer, TonnetzTarget } from "./parts/tonnetz";

type ContextScaleModalProps = {
	readonly value: ContextScale;
	// 参照表示用: このcontextScaleの前後のコードと、さらにその外側のcontextScale。
	// コードとスケールの立ち位置がChordModalと逆になる(スケールが主役で、コードがその間にある)
	readonly formerChord?: Chord;
	readonly latterChord?: Chord;
	readonly prevContextScale?: ContextScale;
	readonly nextContextScale?: ContextScale;
	readonly onConfirm: (contextScale: ContextScale) => void;
	readonly onCancel: () => void;
};

// スケール名はプルダウンで選び、key(スケールを置く位置)はトネッツ図上で選ぶ。
// keyのプルダウンも同等の操作として残してある
export function ContextScaleModal(props: ContextScaleModalProps) {
	const { value, formerChord, latterChord, prevContextScale, nextContextScale, onConfirm, onCancel } = props;
	const [key, setKey] = useState<PitchClass>(value.key);
	const [name, setName] = useState<string>(value.name);

	// トネッツ図への参照オーバーレイの表示切替。前後のコードのみ既定で表示する
	const [showFormerChord, setShowFormerChord] = useState(true);
	const [showLatterChord, setShowLatterChord] = useState(true);
	const [showPrevScale, setShowPrevScale] = useState(false);
	const [showNextScale, setShowNextScale] = useState(false);

	// ホバー中の最寄り頂点のピッチクラス値。クリックでkeyになる位置のプレビュー(薄表示)に使う
	const [hoverKeyValue, setHoverKeyValue] = useState<number | null>(null);

	const scale = new ContextScale(key, name).getScale();

	// 編集中のスケール一式(構成音・連結辺・主音の二重ボーダー)を指定の強度で表示する
	const scaleLayer = (scaleKey: PitchClass, emphasis: "faint" | "normal"): TonnetzLayer => ({
		className: emphasis,
		pitchClasses: scale.getPitchClasses(scaleKey),
		connect: true,
		rings: [scaleKey],
	});

	// 前後のcontextScaleは背景(半透明のグレー)として敷く
	const contextLayer = (contextScale: ContextScale): TonnetzLayer => ({
		className: "context",
		pitchClasses: contextScale.getScale().getPitchClasses(contextScale.key),
		connect: true,
		fillContained: true,
		rings: [contextScale.key],
	});

	// 前後のコードは薄いコード表示(トライアドの塗り・構成音・連結辺)
	const chordLayer = (chord: Chord): TonnetzLayer => ({
		className: "faint",
		triads: [chord.triad],
		pitchClasses: chord.chordTones,
		connect: true,
	});

	const layers: TonnetzLayer[] = [
		...(showPrevScale && prevContextScale ? [contextLayer(prevContextScale)] : []),
		...(showNextScale && nextContextScale ? [contextLayer(nextContextScale)] : []),
		...(showFormerChord && formerChord ? [chordLayer(formerChord)] : []),
		...(showLatterChord && latterChord ? [chordLayer(latterChord)] : []),
		// ホバー位置にスナップしたスケールの薄表示(クリック結果のプレビュー)
		...(hoverKeyValue !== null && hoverKeyValue !== key.value
			? [scaleLayer(new PitchClass(hoverKeyValue), "faint")]
			: []),
		scaleLayer(key, "normal"),
	];

	const handleHover = (target: TonnetzTarget | null): void => {
		setHoverKeyValue(target === null ? null : target.nearestPitchClass.value);
	};

	// 前後のコードを、編集中のスケール選択から見たディグリー(VImなど)で表示する
	const degreeNotation = (chord: Chord): string =>
		new DegreeTriad(chord.triad.root.getDegree(key), chord.triad.mode).toString();

	const scaleNotation = (contextScale: ContextScale): string =>
		`${contextScale.key.toString()} ${contextScale.name}`;

	// コンテキスト帯の1マス。上段(前後のコード)と下段(スケール)で共通のセル構造
	const contextCell = (className: string, content: ReactNode, toggle?: ReactNode): ReactNode => (
		<div className={`context-strip__cell ${className}`}>
			<div className="context-strip__value">{content}</div>
			{toggle}
		</div>
	);

	return (
		<Modal className="context-scale-modal" title="Edit Context Scale" onCancel={onCancel} onConfirm={() => onConfirm(new ContextScale(key, name))}>
			<div className="modal-split">
				<div className="modal-split__tonnetz-pane">
					<Tonnetz
						layers={layers}
						onTap={target => setKey(target.nearestPitchClass)}
						onHover={handleHover}
					/>
				</div>
				<div className="modal-split__detail-pane">
					{/* 前後関係: 上段に前後のコード(編集中のスケールから見たディグリー)、下段にスケール */}
					<div className="context-strip">
						{contextCell(
							"context-strip__cell--top-left",
							formerChord ? degreeNotation(formerChord) : "–",
							formerChord && <OverlayToggle label="previous chord" visible={showFormerChord} onToggle={() => setShowFormerChord(v => !v)} />
						)}
						{contextCell(
							"context-strip__cell--top-right",
							latterChord ? degreeNotation(latterChord) : "–",
							latterChord && <OverlayToggle label="next chord" visible={showLatterChord} onToggle={() => setShowLatterChord(v => !v)} />
						)}
						{contextCell(
							"context-strip__cell--left",
							prevContextScale ? scaleNotation(prevContextScale) : "–",
							prevContextScale && <OverlayToggle label="previous context scale" visible={showPrevScale} onToggle={() => setShowPrevScale(v => !v)} />
						)}
						{contextCell(
							"context-strip__cell--current",
							scaleNotation(new ContextScale(key, name))
						)}
						{contextCell(
							"context-strip__cell--right",
							nextContextScale ? scaleNotation(nextContextScale) : "–",
							nextContextScale && <OverlayToggle label="next context scale" visible={showNextScale} onToggle={() => setShowNextScale(v => !v)} />
						)}
					</div>
					<div className="context-scale-modal__controls">
						<select
							value={String(key.value)}
							onChange={event => setKey(PitchClass.all[Number(event.target.value)])}
						>
							{PitchClass.all.map(pc => (
								<option key={pc.value} value={pc.value}>{pc.toString()}</option>
							))}
						</select>
						<select
							value={name}
							onChange={event => setName(event.target.value)}
						>
							{knownScaleNames.map(scaleName => (
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
