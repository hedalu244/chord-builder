import { ReactNode, useState } from "react";
import { allTriads, Triad } from "../basics/triad";
import { Chord } from "../basics/chord";
import { ContextScale } from "../basics/contextScale";
import { findQualityMatch, knownQualities, qualityLabel, qualityTones, qualityTriad } from "../basics/knownQuality";
import { PitchClass } from "../basics/pitch";
import { nearestTriangle, triangleTriad } from "../basics/tonnetz";
import { ChordNotation } from "./parts/chordNotation";
import { Modal } from "./parts/modal";
import { EditableToneRow } from "./parts/toneRow";
import { Tonnetz, TonnetzLayer, TonnetzTarget } from "./parts/tonnetz";

// 構成音チェックボックスの並びはCに固定し、トライアドを切り替えても位置が動かないようにする
const TONE_ROW_ROOT = new PitchClass(0);

type EditTab = "quick" | "direct";

// トライアド+構成音の組。編集中のステートそのものと、ホバー時の「クリックしたらこうなる」
// プレビューの両方をこの形で扱う
type ChordShape = {
	readonly triad: Triad | null;
	readonly toneValues: ReadonlySet<number>;
};

// トネッツ図上のコード表示の強調優先度(薄く/通常)
type ChordEmphasis = "faint" | "normal";

// コンテキスト帯のコードセルのホバー対象
type StripHover = "prev" | "next" | null;

function setEquals(a: ReadonlySet<number>, b: ReadonlySet<number>): boolean {
	return a.size === b.size && [...a].every(value => b.has(value));
}

function shapeEquals(a: ChordShape | null, b: ChordShape | null): boolean {
	if (a === null || b === null) return a === b;
	if (a.triad === null || b.triad === null) {
		if (a.triad !== b.triad) return false;
	} else if (!a.triad.equals(b.triad)) {
		return false;
	}
	return setEquals(a.toneValues, b.toneValues);
}

function chordToShape(chord: Chord): ChordShape {
	return { triad: chord.triad, toneValues: new Set(chord.chordTones.map(tone => tone.value)) };
}

// コード一式(トライアドの塗り・構成音ノード・構成音同士を結ぶ辺)を1つのレイヤとして表す
function chordLayer(shape: ChordShape, emphasis: ChordEmphasis): TonnetzLayer {
	return {
		className: `chord-${emphasis}`,
		triads: shape.triad ? [shape.triad] : [],
		pitchClasses: PitchClass.map([...shape.toneValues]),
		connect: true,
	};
}

function optionButtonClassName(selected: boolean): string {
	return selected ? "option-button option-button--selected" : "option-button";
}

// 前後のコード・contextScaleのトネッツ図への表示切替(目のアイコンのトグルボタン)。
// 対象が存在しない位置ではボタンごと表示しない(呼び出し側でundefinedを渡す)
function OverlayToggle(props: { readonly label: string; readonly visible: boolean; readonly onToggle: () => void }) {
	const { label, visible, onToggle } = props;
	return (
		<button
			type="button"
			className={visible ? "chord-modal__overlay-toggle chord-modal__overlay-toggle--on" : "chord-modal__overlay-toggle"}
			title={visible ? `Hide ${label} on Tonnetz` : `Show ${label} on Tonnetz`}
			aria-pressed={visible}
			onClick={onToggle}
		>
			<img src={visible ? "icons/eye.svg" : "icons/eye-off.svg"} alt="" />
		</button>
	);
}

type ChordModalProps = {
	// nullの場合は「まだ何も選択していない」状態でモーダルを開く(プレースホルダーへの新規設定向け)
	readonly initialChord: Chord | null;
	// 参照表示用: 前後のコードと、それらと編集中コードを関連付けるcontextScale
	readonly prevChord?: Chord;
	readonly nextChord?: Chord;
	readonly contextBefore?: ContextScale; // prevChordと編集中コードの間
	readonly contextAfter?: ContextScale;  // 編集中コードとnextChordの間
	readonly onConfirm: (chord: Chord) => void;
	readonly onCancel: () => void;
};

export function ChordModal(props: ChordModalProps) {
	const { initialChord, prevChord, nextChord, contextBefore, contextAfter, onConfirm, onCancel } = props;
	const [triad, setTriad] = useState<Triad | null>(initialChord?.triad ?? null);
	const [activeValues, setActiveValues] = useState<ReadonlySet<number>>(
		() => new Set((initialChord?.chordTones ?? []).map(tone => tone.value))
	);

	// quickタブのプルダウン選択状態。タブ切替時に現在のステートから解釈し直す(一致がなければ未選択)。
	// quickは既知クオリティのみを表現できる片方向互換のため、未選択のままでもステートには触れない
	const initialMatch = triad !== null ? findQualityMatch(triad, activeValues) : undefined;
	const [tab, setTab] = useState<EditTab>(initialChord === null || initialMatch !== undefined ? "quick" : "direct");
	const [quickRootValue, setQuickRootValue] = useState<number | null>(initialMatch?.root.value ?? null);
	const [quickQualityIndex, setQuickQualityIndex] = useState<number | null>(initialMatch?.qualityIndex ?? null);

	// トネッツ図への参照オーバーレイの表示切替。直前のcontextScaleのみ既定で表示する
	const [showPrevChord, setShowPrevChord] = useState(false);
	const [showContextBefore, setShowContextBefore] = useState(true);
	const [showContextAfter, setShowContextAfter] = useState(false);
	const [showNextChord, setShowNextChord] = useState(false);

	// トネッツ図のホバー位置でクリックしたときにできるであろうコードのプレビュー
	const [hoverShape, setHoverShape] = useState<ChordShape | null>(null);
	// コンテキスト帯の前後コードセルのホバー。その間は編集中コードを薄く落とし、
	// ホバーされたコードを通常表示にして見比べられるようにする
	const [stripHover, setStripHover] = useState<StripHover>(null);

	// 新規設定(initialChordなし)か既存コードの変更かで、タイトルと確定ボタンの表示を分ける
	const isNewChord = initialChord === null;

	const handleSwitchTab = (next: EditTab): void => {
		if (next === "quick") {
			// direct→quick: 一致するクオリティがあれば選択済みとして引き継ぐ。なければ未選択(ステートは保持)
			const match = triad !== null ? findQualityMatch(triad, activeValues) : undefined;
			setQuickRootValue(match?.root.value ?? null);
			setQuickQualityIndex(match?.qualityIndex ?? null);
		}
		setTab(next);
	};

	// --- directモードの操作 ---

	// トライアドの選び直しでは構成音の選択に触れない(有名和音の一括入力はquickモードが担う)。
	// ただし未選択状態からの初回選択時のみ、空のコードにならないようトライアドの構成音を設定する
	const handleSelectTriad = (candidate: Triad): void => {
		if (triad === null) {
			setActiveValues(new Set(candidate.getChordTones().map(tone => tone.value)));
		}
		setTriad(candidate);
	};

	// --- quickモードの操作 ---

	// ルートとクオリティが揃ったら、トライアドと構成音をまとめて上書きする
	const applyQuick = (rootValue: number, qualityIndex: number): void => {
		const quality = knownQualities[qualityIndex];
		const root = new PitchClass(rootValue);
		setTriad(qualityTriad(root, quality));
		setActiveValues(new Set(qualityTones(root, quality).map(tone => tone.value)));
		setQuickRootValue(rootValue);
		setQuickQualityIndex(qualityIndex);
	};

	const handleQuickRootChange = (rootValue: number | null): void => {
		setQuickRootValue(rootValue);
		if (rootValue !== null && quickQualityIndex !== null) applyQuick(rootValue, quickQualityIndex);
	};

	const handleQuickQualityChange = (qualityIndex: number | null): void => {
		setQuickQualityIndex(qualityIndex);
		if (qualityIndex !== null && quickRootValue !== null) applyQuick(quickRootValue, qualityIndex);
	};

	// --- トネッツ図の操作 ---

	// その位置でクリックしたときにできるであろうコード。クリックできない位置(quickでクオリティ未選択)はnull。
	// ホバー時の薄表示とクリック時の確定の両方がこれを参照し、プレビューと実挙動がずれないようにする。
	// quickモードでは三角形の内外ではなく「クオリティのモードと一致する最寄りの三角形(内心距離)」で判定する
	const shapeAt = (target: TonnetzTarget): ChordShape | null => {
		if (tab === "quick") {
			if (quickQualityIndex === null) return null;
			const quality = knownQualities[quickQualityIndex];
			const baseTriad = triangleTriad(nearestTriangle(target.world, quality.triadMode));
			const root = baseTriad.root.sub(quality.triadOffset);
			return { triad: baseTriad, toneValues: new Set(qualityTones(root, quality).map(tone => tone.value)) };
		}
		if (target.onNode) {
			const next = new Set(activeValues);
			const value = target.nearestPitchClass.value;
			if (next.has(value)) next.delete(value);
			else next.add(value);
			return { triad, toneValues: next };
		}
		return {
			triad: target.triad,
			toneValues: triad === null
				? new Set(target.triad.getChordTones().map(tone => tone.value))
				: activeValues,
		};
	};

	const handleTonnetzHover = (target: TonnetzTarget | null): void => {
		const next = target === null ? null : shapeAt(target);
		setHoverShape(prev => (shapeEquals(prev, next) ? prev : next));
	};

	const handleTonnetzTap = (target: TonnetzTarget): void => {
		if (tab === "quick") {
			// quickはクオリティのルート選択も兼ねるためapplyQuick経由で確定する
			if (quickQualityIndex === null) return;
			const quality = knownQualities[quickQualityIndex];
			const baseTriad = triangleTriad(nearestTriangle(target.world, quality.triadMode));
			applyQuick(baseTriad.root.sub(quality.triadOffset).value, quickQualityIndex);
			return;
		}
		const shape = shapeAt(target);
		if (shape === null) return;
		setTriad(shape.triad);
		setActiveValues(shape.toneValues);
	};

	// --- トネッツ図のレイヤ構築 ---

	// contextScaleはあくまで背景: 半透明の線と塗りで表し、両方のスケールに含まれる箇所は
	// 重なって自然に濃くなる。コードの表示(下記)が常に上に乗る
	const contextLayer = (contextScale: ContextScale): TonnetzLayer => ({
		className: "context",
		pitchClasses: contextScale.getScale().getPitchClasses(contextScale.key),
		connect: true,
		fillContained: true,
	});

	// コードの表示は「薄く(前後のコード・ホバープレビュー) < 通常(編集中のコード)」の2段階。
	// 濃い表示ほど後(上)に描く。コンテキスト帯で前後コードをホバーしている間は主役を入れ替え、
	// 編集中コードを薄く落としてホバーされたコードを通常表示する
	const layers: TonnetzLayer[] = [
		...(showContextBefore && contextBefore ? [contextLayer(contextBefore)] : []),
		...(showContextAfter && contextAfter ? [contextLayer(contextAfter)] : []),
		...(prevChord && showPrevChord && stripHover !== "prev" ? [chordLayer(chordToShape(prevChord), "faint")] : []),
		...(nextChord && showNextChord && stripHover !== "next" ? [chordLayer(chordToShape(nextChord), "faint")] : []),
		...(hoverShape ? [chordLayer(hoverShape, "faint")] : []),
		chordLayer({ triad, toneValues: activeValues }, stripHover === null ? "normal" : "faint"),
		...(prevChord && stripHover === "prev" ? [chordLayer(chordToShape(prevChord), "normal")] : []),
		...(nextChord && stripHover === "next" ? [chordLayer(chordToShape(nextChord), "normal")] : []),
	];

	const chord = triad ? new Chord(triad, PitchClass.map(Array.from(activeValues))) : null;

	// コンテキスト帯の1マス。上段(contextScale)と下段(コード)で共通のセル構造。
	// hoverKeyを持つセル(実在するコード)はホバー中、そのコードをトネッツ図上で濃く表示する
	const contextCell = (
		className: string,
		content: ReactNode,
		toggle?: ReactNode,
		hoverKey?: Exclude<StripHover, null>
	): ReactNode => (
		<div
			className={`chord-modal__context-cell ${className}`}
			onMouseEnter={hoverKey && (() => setStripHover(hoverKey))}
			onMouseLeave={hoverKey && (() => setStripHover(current => (current === hoverKey ? null : current)))}
		>
			<div className="chord-modal__context-value">{content}</div>
			{toggle}
		</div>
	);

	return (
		<Modal
			className="chord-modal"
			title={isNewChord ? "Insert Chord" : "Select Chord"}
			onCancel={onCancel}
			onConfirm={() => chord && onConfirm(chord)}
			confirmLabel={isNewChord ? "Add" : "OK"}
			confirmDisabled={chord === null}
		>
			<div className="chord-modal__body">
				<div className="chord-modal__tonnetz-pane">
					<Tonnetz
						layers={layers}
						showTriadLabels
						onTap={handleTonnetzTap}
						onHover={handleTonnetzHover}
					/>
				</div>
				<div className="chord-modal__detail-pane">
					{/* 前後関係: 上段にcontextScale、下段に前後のコードと編集中コード */}
					<div className="chord-modal__context-strip">
						{contextCell(
							"chord-modal__context-cell--scale chord-modal__context-cell--before",
							contextBefore ? `${contextBefore.key.toString()} ${contextBefore.name}` : "–",
							contextBefore && <OverlayToggle label="previous context scale" visible={showContextBefore} onToggle={() => setShowContextBefore(v => !v)} />
						)}
						{contextCell(
							"chord-modal__context-cell--scale chord-modal__context-cell--after",
							contextAfter ? `${contextAfter.key.toString()} ${contextAfter.name}` : "–",
							contextAfter && <OverlayToggle label="next context scale" visible={showContextAfter} onToggle={() => setShowContextAfter(v => !v)} />
						)}
						{contextCell(
							"chord-modal__context-cell--chord chord-modal__context-cell--prev",
							prevChord ? <ChordNotation chord={prevChord} /> : "–",
							prevChord && <OverlayToggle label="previous chord" visible={showPrevChord} onToggle={() => setShowPrevChord(v => !v)} />,
							prevChord && "prev"
						)}
						{contextCell(
							"chord-modal__context-cell--current",
							chord ? <ChordNotation chord={chord} /> : "–"
						)}
						{contextCell(
							"chord-modal__context-cell--chord chord-modal__context-cell--next",
							nextChord ? <ChordNotation chord={nextChord} /> : "–",
							nextChord && <OverlayToggle label="next chord" visible={showNextChord} onToggle={() => setShowNextChord(v => !v)} />,
							nextChord && "next"
						)}
					</div>
					{chord && chord.getKnownNotations().length > 0 && (
						<span className="alt-notations">{chord.getKnownNotations().join(" / ")}</span>
					)}
					<div className="chord-modal__tabs" role="tablist">
						<button
							type="button"
							role="tab"
							aria-selected={tab === "quick"}
							className={tab === "quick" ? "chord-modal__tab chord-modal__tab--active" : "chord-modal__tab"}
							onClick={() => handleSwitchTab("quick")}
						>
							Quick
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={tab === "direct"}
							className={tab === "direct" ? "chord-modal__tab chord-modal__tab--active" : "chord-modal__tab"}
							onClick={() => handleSwitchTab("direct")}
						>
							Direct
						</button>
					</div>
					{tab === "quick" ? (
						<div className="chord-modal__quick">
							<div className="chord-modal__quick-controls">
								<label>
									Root
									<select
										value={quickRootValue === null ? "" : String(quickRootValue)}
										onChange={event => handleQuickRootChange(event.target.value === "" ? null : Number(event.target.value))}
									>
										<option value="">–</option>
										{PitchClass.all.map(pc => (
											<option key={pc.value} value={pc.value}>{pc.toString()}</option>
										))}
									</select>
								</label>
								<label>
									Quality
									<select
										value={quickQualityIndex === null ? "" : String(quickQualityIndex)}
										onChange={event => handleQuickQualityChange(event.target.value === "" ? null : Number(event.target.value))}
									>
										<option value="">–</option>
										{knownQualities.map((quality, index) => (
											<option key={index} value={index}>{qualityLabel(quality)}</option>
										))}
									</select>
								</label>
							</div>
							<p className="chord-modal__hint">
								{quickQualityIndex === null
									? "Select a quality to enable one-click input on the Tonnetz."
									: `Click a ${knownQualities[quickQualityIndex].triadMode === "M" ? "major" : "minor"} triad on the Tonnetz to enter the chord there.`}
							</p>
						</div>
					) : (
						<div className="chord-modal__direct">
							<div className="chord-modal__direct-grid">
								{allTriads().map(candidate => (
									<button
										type="button"
										key={candidate.toString()}
										className={optionButtonClassName(triad !== null && triad.equals(candidate))}
										onClick={() => handleSelectTriad(candidate)}
									>
										{candidate.toString()}
									</button>
								))}
							</div>
							<EditableToneRow root={TONE_ROW_ROOT} activeValues={activeValues} onChange={setActiveValues} />
						</div>
					)}
				</div>
			</div>
		</Modal>
	);
}
