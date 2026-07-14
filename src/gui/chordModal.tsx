import { useState } from "react";
import { allTriads, Triad } from "../basics/triad";
import { Chord } from "../basics/chord";
import { ScaleInfo } from "../basics/scaleInfo";
import { findQualityMatch, KnownQualityId, knownQualities, qualityById, qualityToChord, getKnownNotations } from "../basics/knownQuality";
import { PitchClass } from "../basics/pitch";
import { nearestTriad } from "../basics/tonnetz";
import { ChordContextStrip, ContextPosition, ContextVisibility } from "./parts/contextStrip";
import { Modal } from "./parts/modal";
import { Tabs } from "./parts/tabs";
import { EditableToneRow } from "./parts/toneRow";
import { Tonnetz, TonnetzTarget } from "./parts/tonnetz";
import { chordLayer, contextEmphasis, currentEmphasis, scaleLayer, TonnetzLayer } from "./parts/tonnetzLayer";

// 構成音チェックボックスの並びはCに固定し、トライアドを切り替えても位置が動かないようにする
const TONE_ROW_ROOT = new PitchClass(0);

type EditMode = "quick" | "direct";
type QuickQuality = "triad" | KnownQualityId;

// quickタブのクオリティ選択肢。プルダウンにはmajor/minorの個別項目は並べず、代わりに
// 「Triad」(上向き/下向きどちらの三角もクリック可能)をまとめて置く
const QUICK_QUALITY_OPTIONS: readonly { readonly value: QuickQuality; readonly label: string; }[] = [
	{ value: "triad", label: "Triad" },
	...knownQualities
		.filter(quality => quality.id !== "M" && quality.id !== "m")
		.map(quality => ({ value: quality.id, label: quality.notation })),
];

// コードをquickタブの選択として解釈し直す。
function quickSelectionFor(chord: Chord | null): QuickQuality | null {
	const match = chord !== null ? findQualityMatch(chord.triad, chord.chordTones) : undefined;
	if (match === undefined) return null;
	return match.qualityId === "M" || match.qualityId === "m" ? "triad" : match.qualityId;
}

// quickModeでトネッツ図上の位置をクリック/ホバーした結果できるコード。
function quickChordAt(target: TonnetzTarget, quality: QuickQuality | null): Chord {
	if (quality === "triad" || quality === null) return Chord.bareTriad(target.triad);
	const knownQuality = qualityById(quality);
	const root = nearestTriad(target.world, knownQuality.triadMode).root;
	return qualityToChord(root, knownQuality);
}

function directChordAt(target: TonnetzTarget, currentChord: Chord | null): Chord {
	// 初回選択時はnodeを無視してトライアドだけ判定。トライアドの構成音をそのまま採用
	if (currentChord === null) {
		return Chord.bareTriad(target.triad);
	}
	// nodeをクリックしたら構成音をトグル
	if (target.onNode) {
		const tapped = target.node.pitchClass;
		const nextTones = currentChord.chordTones.some(tone => tone.equals(tapped))
			? currentChord.chordTones.filter(tone => !tone.equals(tapped))
			: [...currentChord.chordTones, tapped];
		return new Chord(currentChord.triad, nextTones);
	}
	// トライアドを切り替え。構成音はそのまま引き継ぐ
	return new Chord(target.triad, currentChord.chordTones);
}

// その位置でクリックしたときにできるであろうコード。
// ホバー時の薄表示とクリック時の確定の両方がこれを参照し、プレビューと実挙動がずれないようにする
const chordAt = (target: TonnetzTarget, tab: EditMode, quickQuality: QuickQuality | null, currentChord: Chord | null): Chord => {
	if (tab === "quick") return quickChordAt(target, quickQuality);
	return directChordAt(target, currentChord);
};

function optionButtonClassName(selected: boolean): string {
	return selected ? "option-button option-button--selected" : "option-button";
}

type ChordModalProps = {
	// nullの場合は「まだ何も選択していない」状態でモーダルを開く(プレースホルダーへの新規設定向け)
	readonly initialChord: Chord | null;
	// 参照表示用: 前後のコードと、それらと編集中コードを関連付けるcontextScale
	readonly formerChord?: Chord;
	readonly latterChord?: Chord;
	readonly formerScale?: ScaleInfo; // formerChordと編集中コードの間
	readonly latterScale?: ScaleInfo; // 編集中コードとlatterChordの間
	readonly onConfirm: (chord: Chord) => void;
	readonly onCancel: () => void;
};

export function ChordModal(props: ChordModalProps) {
	const { initialChord, formerChord, latterChord, formerScale, latterScale, onConfirm, onCancel } = props;
	// 編集中のコード。nullは「トライアド未選択」の初期状態
	const [currentChord, setCurrentChord] = useState<Chord | null>(initialChord);

	const [editMode, setEditMode] = useState<EditMode>(
		() => initialChord === null || quickSelectionFor(initialChord) !== null ? "quick" : "direct"
	);
	const quickQuality = quickSelectionFor(currentChord);
	const altNotations = currentChord ? getKnownNotations(currentChord).join(" / ") : "";

	const [stripVisibility, setStripVisibility] = useState<ContextVisibility>({
		"former-scale": true,
		"latter-scale": false,
		"former-chord": false,
		"latter-chord": false,
		"current": true,
	});

	// トネッツ図のホバー位置でクリックしたときにできるであろうコードのプレビュー
	const [hoverChord, setHoverChord] = useState<Chord | null>(null);
	const [stripHoverPosition, setStripHoverPosition] = useState<ContextPosition | "current" | undefined>(undefined);

	// 新規設定(initialChordなし)か既存コードの変更かで、タイトルと確定ボタンの表示を分ける
	const isNewChord = initialChord === null;

	// トライアドの選び直しでは構成音の選択に触れない(有名和音の一括入力はquickモードが担う)。
	// ただし未選択状態からの初回選択時のみ、空のコードにならないようトライアドの構成音を設定する
	const handleSelectTriad = (candidate: Triad): void => {
		setCurrentChord(prev => new Chord(candidate, prev === null ? candidate.getChordTones() : prev.chordTones));
	};

	// クオリティの選び直し。すでにコードがあれば、その時点でのルート解釈を引き継いで即座に反映する
	// (rootはトネッツのクリックでのみ決まるため、現在のtriadのルート/modeを引き継ぐ)
	const handleQuickQualityChange = (quality: QuickQuality): void => {
		if (currentChord === null) return;
		if (quality === "triad") {
			setCurrentChord(Chord.bareTriad(currentChord.triad));
			return;
		}
		setCurrentChord(qualityToChord(currentChord.triad.root, qualityById(quality)));
	};

	// --- トネッツ図の操作 ---
	const handleTonnetzHover = (target: TonnetzTarget | null): void => {
		const next = target === null ? null : chordAt(target, editMode, quickQuality, currentChord);
		setHoverChord(prev => (prev !== null && next !== null && prev.equals(next) ? prev : next));
	};

	const handleTonnetzTap = (target: TonnetzTarget): void => setCurrentChord(chordAt(target, editMode, quickQuality, currentChord));

	// --- トネッツ図のレイヤ構築 ---
	// Emphasisのルール:
	// - former/latterのchord・scaleはvisibleならfaint(scaleはbackdrop)。contextStrip上で
	//   hoverされている間はnormal。visibleでなければhidden
	// - 編集中のcurrentChordは既定でnormal。current以外がhoverされている間はfaintに退く
	// - hoverChord(トネッツ上のクリック結果のプレビュー)はfaintで、currentChordはnormalのまま
	const formerScaleEmphasis = contextEmphasis("former-scale", stripHoverPosition, stripVisibility, "faint");
	const latterScaleEmphasis = contextEmphasis("latter-scale", stripHoverPosition, stripVisibility, "faint");
	const formerChordEmphasis = contextEmphasis("former-chord", stripHoverPosition, stripVisibility, "faint");
	const latterChordEmphasis = contextEmphasis("latter-chord", stripHoverPosition, stripVisibility, "faint");
	const layers: TonnetzLayer[] = [
		scaleLayer(formerScale, formerScaleEmphasis === "faint" ? "backdrop" : "hidden"),
		scaleLayer(latterScale, latterScaleEmphasis === "faint" ? "backdrop" : "hidden"),
		chordLayer(formerChord, formerChordEmphasis === "faint" ? "faint" : "hidden"),
		chordLayer(latterChord, latterChordEmphasis === "faint" ? "faint" : "hidden"),
		chordLayer(hoverChord, "faint"),
		chordLayer(currentChord, currentEmphasis(stripHoverPosition, "normal")),
		scaleLayer(formerScale, formerScaleEmphasis === "normal" ? "normal" : "hidden"),
		scaleLayer(latterScale, latterScaleEmphasis === "normal" ? "normal" : "hidden"),
		chordLayer(formerChord, formerChordEmphasis === "normal" ? "normal" : "hidden"),
		chordLayer(latterChord, latterChordEmphasis === "normal" ? "normal" : "hidden"),
	];

	return (
		<Modal
			className="chord-modal"
			title={isNewChord ? "Insert Chord" : "Select Chord"}
			onCancel={onCancel}
			onConfirm={() => currentChord && onConfirm(currentChord)}
			confirmLabel={isNewChord ? "Add" : "OK"}
			confirmDisabled={currentChord === null}
		>
			<div className="modal-split">
				<div className="modal-split__tonnetz-pane">
					<Tonnetz
						layers={layers}
						showTriadLabels
						onTap={handleTonnetzTap}
						onHover={handleTonnetzHover}
					/>
				</div>
				<div className="modal-split__detail-pane">
					<ChordContextStrip
						formerScale={formerScale}
						latterScale={latterScale}
						formerChord={formerChord}
						currentChord={currentChord ?? undefined}
						latterChord={latterChord}
						visibility={stripVisibility}
						onVisibilityChange={setStripVisibility}
						onHoverChange={setStripHoverPosition}
					/>
					<span className="alt-notations">{altNotations || "\u00A0"}</span>
					<Tabs<EditMode>
						mode={editMode}
						onSwitch={setEditMode}
						tabs={[
							{
								label: "Quick",
								mode: "quick",
								content: (
									<div className="chord-modal__quick">
										<div className="chord-modal__quick-controls">
											{QUICK_QUALITY_OPTIONS.map(option => (
												<button
													type="button"
													key={option.value}
													className={optionButtonClassName((quickQuality ?? "triad") === option.value)}
													onClick={() => handleQuickQualityChange(option.value)}
												>
													{option.label}
												</button>
											))}
										</div>
										<p className="modal-split__hint">
											{quickQuality === "triad" || quickQuality === null
												? "Click a triad on the Tonnetz to enter the chord there."
												: `Click a ${qualityById(quickQuality).triadMode === "M" ? "major" : "minor"} triad on the Tonnetz to enter the chord there.`}
										</p>
									</div>
								),
							},
							{
								label: "Direct",
								mode: "direct",
								content: (
									<div className="chord-modal__direct">
										<div className="chord-modal__direct-grid">
											{allTriads().map(candidate => (
												<button
													type="button"
													key={candidate.toString()}
													className={optionButtonClassName(currentChord !== null && currentChord.triad.equals(candidate))}
													onClick={() => handleSelectTriad(candidate)}
												>
													{candidate.toString()}
												</button>
											))}
										</div>
										<EditableToneRow
											root={TONE_ROW_ROOT}
											activeValues={new Set(currentChord?.chordTones.map(tone => tone.value) ?? [])}
											onChange={values => currentChord && setCurrentChord(new Chord(currentChord.triad, PitchClass.map([...values])))}
										/>
									</div>
								),
							},
						]}
					/>
				</div>
			</div>
		</Modal>
	);
}
