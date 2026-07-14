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
import { chordLayer, scaleBackdropLayer, TonnetzLayer } from "./parts/tonnetzLayer";

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

// コードをquickタブの選択として解釈し直す。一致する既知クオリティがなければ未選択(null)。
// 素のメジャー/マイナートライアドに一致した場合はTriadとして扱う
function quickSelectionFor(chord: Chord | null): QuickQuality | null {
	const match = chord !== null ? findQualityMatch(chord.triad, chord.chordTones) : undefined;
	if (match === undefined) return null;
	return match.qualityId === "M" || match.qualityId === "m" ? "triad" : match.qualityId;
}

// トネッツ図上の位置をクリック/ホバーした結果できるコード。Triad、あるいはクオリティ無選択時は
// クリックされた三角形をそのまま採用する(上向き/下向きどちらでも良い)。既知クオリティが選択されて
// いる場合は、そのクオリティのtriadModeに一致する最寄りの三角形を土台にルートを逆算する
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
		() => initialChord === null || quickSelectionFor(initialChord) !== null ? "quick" : "direct"
	);
	const quickQuality = quickSelectionFor(currentChord);
	const altNotations = currentChord ? getKnownNotations(currentChord).join(" / ") : "";

	const [stripVisibility, setStripVisibility] = useState<ContextVisibility>({
		"former-scale": true,
		"latter-scale": false,
		"former-chord": false,
		"latter-chord": false,
	});

	// トネッツ図のホバー位置でクリックしたときにできるであろうコードのプレビュー
	const [hoverChord, setHoverChord] = useState<Chord | null>(null);
	const [stripHoverPosition, setStripHoverPosition] = useState<ContextPosition | "current" | undefined>(undefined);

	// 新規設定(initialChordなし)か既存コードの変更かで、タイトルと確定ボタンの表示を分ける
	const isNewChord = initialChord === null;

	// --- directモードの操作 ---

	// トライアドの選び直しでは構成音の選択に触れない(有名和音の一括入力はquickモードが担う)。
	// ただし未選択状態からの初回選択時のみ、空のコードにならないようトライアドの構成音を設定する
	const handleSelectTriad = (candidate: Triad): void => {
		setCurrentChord(prev => new Chord(candidate, prev === null ? candidate.getChordTones() : prev.chordTones));
	};

	// --- quickモードの操作 ---

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

	// その位置でクリックしたときにできるであろうコード。directでトライアド未選択のままノードを
	// クリックした場合のみnull。quickは常にコードが定まる(無選択時はTriad扱い)。
	// ホバー時の薄表示とクリック時の確定の両方がこれを参照し、プレビューと実挙動がずれないようにする
	const chordAt = (target: TonnetzTarget): Chord => {
		if (tab === "quick") return quickChordAt(target, quickQuality);
		return directChordAt(target, currentChord);
	};

	const handleTonnetzHover = (target: TonnetzTarget | null): void => {
		const next = target === null ? null : chordAt(target);
		setHoverChord(prev => (prev !== null && next !== null && prev.equals(next) ? prev : next));
	};

	const handleTonnetzTap = (target: TonnetzTarget): void => setCurrentChord(chordAt(target));

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
					<span className="alt-notations">{altNotations || "\u00A0"}</span>
					<Tabs<EditMode>
						mode={tab}
						onSwitch={setTab}
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
