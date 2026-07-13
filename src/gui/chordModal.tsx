import { useState } from "react";
import { allTriads, Triad } from "../basics/triad";
import { Chord } from "../basics/chord";
import { ScaleInfo } from "../basics/scaleInfo";
import { findQualityMatch, knownQualities, qualityLabel, qualityTones, qualityTriad } from "../basics/knownQuality";
import { PitchClass } from "../basics/pitch";
import { nearestTriad } from "../basics/tonnetz";
import { ChordContextStrip, ContextPosition, ContextVisibility } from "./parts/contextStrip";
import { Modal } from "./parts/modal";
import { Tabs } from "./parts/tabs";
import { EditableToneRow } from "./parts/toneRow";
import { Tonnetz, TonnetzTarget } from "./parts/tonnetz";
import { chordLayer, scaleBackdropLayer, TonnetzLayer } from "./parts/tonnetzLayer";

// 構成音チェックボックスの並びはCに固定し、トライアドを切り替えても位置が動かないようにする
const TONE_ROW_ROOT = new PitchClass(0);

type EditMode = "quick" | "direct";

// quickタブのプルダウン選択。rootとqualityの両方が揃ったときだけコードとして確定できる
type QuickSelection = {
	readonly rootValue: number | null;
	readonly qualityIndex: number | null;
};

// コードをquickタブの選択として解釈し直す。一致する既知クオリティがなければ未選択
function quickSelectionFor(chord: Chord | null): QuickSelection {
	const match = chord !== null ? findQualityMatch(chord.triad, chord.chordTones) : undefined;
	return { rootValue: match?.root.value ?? null, qualityIndex: match?.qualityIndex ?? null };
}

function chordEquals(a: Chord | null, b: Chord | null): boolean {
	if (a === null || b === null) return a === b;
	return a.equals(b);
}

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

	const [tab, setTab] = useState<EditMode>(
		() => initialChord === null || quickSelectionFor(initialChord).qualityIndex !== null ? "quick" : "direct"
	);
	// quickは既知クオリティのみを表現できる片方向互換のため、未選択のままでもコードには触れない
	const [quickSelection, setQuickSelection] = useState<QuickSelection>(() => quickSelectionFor(initialChord));

	const [stripVisibility, setStripVisibility] = useState<ContextVisibility>({
		"former-scale": true,
		"latter-scale": false,
		"former-chord": false,
		"latter-chord": false,
	});

	// トネッツ図のホバー位置でクリックしたときにできるであろうコードのプレビュー
	const [hoverChord, setHoverChord] = useState<Chord | null>(null);
	const [stripHoverPosition, setStripHoverPosition] = useState<ContextPosition | undefined>(undefined);

	// 新規設定(initialChordなし)か既存コードの変更かで、タイトルと確定ボタンの表示を分ける
	const isNewChord = initialChord === null;

	const handleSwitchTab = (next: EditMode): void => {
		// direct→quick: 現在のコードを選択として解釈し直す(コードには触れない)
		if (next === "quick") setQuickSelection(quickSelectionFor(currentChord));
		setTab(next);
	};

	// --- directモードの操作 ---

	// トライアドの選び直しでは構成音の選択に触れない(有名和音の一括入力はquickモードが担う)。
	// ただし未選択状態からの初回選択時のみ、空のコードにならないようトライアドの構成音を設定する
	const handleSelectTriad = (candidate: Triad): void => {
		setCurrentChord(prev => new Chord(candidate, prev === null ? candidate.getChordTones() : prev.chordTones));
	};

	// --- quickモードの操作 ---

	// ルートとクオリティが揃ったら、トライアドと構成音をまとめて上書きする
	const applyQuick = (rootValue: number, qualityIndex: number): void => {
		const quality = knownQualities[qualityIndex];
		const root = new PitchClass(rootValue);
		setCurrentChord(new Chord(qualityTriad(root, quality), qualityTones(root, quality)));
		setQuickSelection({ rootValue, qualityIndex });
	};

	const handleQuickRootChange = (rootValue: number | null): void => {
		setQuickSelection({ ...quickSelection, rootValue });
		if (rootValue !== null && quickSelection.qualityIndex !== null) applyQuick(rootValue, quickSelection.qualityIndex);
	};

	const handleQuickQualityChange = (qualityIndex: number | null): void => {
		setQuickSelection({ ...quickSelection, qualityIndex });
		if (qualityIndex !== null && quickSelection.rootValue !== null) applyQuick(quickSelection.rootValue, qualityIndex);
	};

	// --- トネッツ図の操作 ---

	// quick: 三角形の内外ではなく「クオリティのモードと一致する最寄りの三角形(内心距離)」を土台に、
	// そこへクオリティ一式を当てはめたコード。rootはプルダウンのRoot選択にも反映される
	const quickChordAt = (target: TonnetzTarget, qualityIndex: number): { root: PitchClass; chord: Chord } => {
		const quality = knownQualities[qualityIndex];
		const baseTriad = nearestTriad(target.world, quality.triadMode);
		const root = baseTriad.root.sub(quality.triadOffset);
		return { root, chord: new Chord(baseTriad, qualityTones(root, quality)) };
	};

	// その位置でクリックしたときにできるであろうコード。クリックできない位置(quickでクオリティ未選択、
	// directでトライアド未選択のままノードをクリック)はnull。
	// ホバー時の薄表示とクリック時の確定の両方がこれを参照し、プレビューと実挙動がずれないようにする
	const chordAt = (target: TonnetzTarget): Chord | null => {
		if (tab === "quick") {
			return quickSelection.qualityIndex === null ? null : quickChordAt(target, quickSelection.qualityIndex).chord;
		}
		if (target.onNode) {
			if (currentChord === null) return null;
			const tapped = target.node.pitchClass;
			const nextTones = currentChord.chordTones.some(tone => tone.equals(tapped))
				? currentChord.chordTones.filter(tone => !tone.equals(tapped))
				: [...currentChord.chordTones, tapped];
			return new Chord(currentChord.triad, nextTones);
		}
		return new Chord(target.triad, currentChord === null ? target.triad.getChordTones() : currentChord.chordTones);
	};

	const handleTonnetzHover = (target: TonnetzTarget | null): void => {
		const next = target === null ? null : chordAt(target);
		setHoverChord(prev => (chordEquals(prev, next) ? prev : next));
	};

	const handleTonnetzTap = (target: TonnetzTarget): void => {
		if (tab === "quick") {
			// quickはクオリティのルート選択も兼ねるためapplyQuick経由で確定する
			if (quickSelection.qualityIndex === null) return;
			applyQuick(quickChordAt(target, quickSelection.qualityIndex).root.value, quickSelection.qualityIndex);
			return;
		}
		const next = chordAt(target);
		if (next !== null) setCurrentChord(next);
	};

	// --- トネッツ図のレイヤ構築 ---

	// 前後のcontextScaleはあくまで背景: 半透明の線と塗りで表し、両方のスケールに含まれる箇所は
	// 重なって自然に濃くなる。コードの表示(下記)が常に上に乗る。
	// コードの表示は「薄く(前後のコード・ホバープレビュー) < 通常(編集中のコード)」の2段階。
	// 濃い表示ほど後(上)に描く。コンテキスト帯で前後コードをホバーしている間は主役を入れ替え、
	// 編集中コードを薄く落としてホバーされたコードを通常表示する
	const layers: TonnetzLayer[] = [
		...(stripVisibility["former-scale"] && formerScale ? [scaleBackdropLayer(formerScale)] : []),
		...(stripVisibility["latter-scale"] && latterScale ? [scaleBackdropLayer(latterScale)] : []),
		...(formerChord && stripVisibility["former-chord"] && stripHoverPosition !== "former-chord" ? [chordLayer(formerChord, "faint")] : []),
		...(latterChord && stripVisibility["latter-chord"] && stripHoverPosition !== "latter-chord" ? [chordLayer(latterChord, "faint")] : []),
		...(hoverChord ? [chordLayer(hoverChord, "faint")] : []),
		...(currentChord ? [chordLayer(currentChord, stripHoverPosition === undefined ? "normal" : "faint")] : []),
		...(formerChord && stripHoverPosition === "former-chord" ? [chordLayer(formerChord, "normal")] : []),
		...(latterChord && stripHoverPosition === "latter-chord" ? [chordLayer(latterChord, "normal")] : []),
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
					{currentChord && currentChord.getKnownNotations().length > 0 && (
						<span className="alt-notations">{currentChord.getKnownNotations().join(" / ")}</span>
					)}
					<Tabs<EditMode>
						mode={tab}
						onSwitch={handleSwitchTab}
						tabs={[
							{
								label: "Quick",
								mode: "quick",
								content: (
									<div className="chord-modal__quick">
										<div className="chord-modal__quick-controls">
											<label>
												Root
												<select
													value={quickSelection.rootValue === null ? "" : String(quickSelection.rootValue)}
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
													value={quickSelection.qualityIndex === null ? "" : String(quickSelection.qualityIndex)}
													onChange={event => handleQuickQualityChange(event.target.value === "" ? null : Number(event.target.value))}
												>
													<option value="">–</option>
													{knownQualities.map((quality, index) => (
														<option key={index} value={index}>{qualityLabel(quality)}</option>
													))}
												</select>
											</label>
										</div>
										<p className="modal-split__hint">
											{quickSelection.qualityIndex === null
												? "Select a quality to enable one-click input on the Tonnetz."
												: `Click a ${knownQualities[quickSelection.qualityIndex].triadMode === "M" ? "major" : "minor"} triad on the Tonnetz to enter the chord there.`}
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
