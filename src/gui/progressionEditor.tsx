import { ReactNode, useEffect, useRef, useState } from "react";
import { ChordModal } from "./chordModal";
import { ChordEntryPanel } from "./layout/chordEntryPanel";
import { ContextScaleModal } from "./contextScaleModal";
import { AutoContextScalePanel, ContextScalePanel } from "./layout/contextScalePanel";
import { Chord } from "../basics/chord";
import { ChordEntry } from "../editor/chordEntry";
import { ScaleInfo } from "../basics/scaleInfo";
import { contextScaleNames } from "../basics/scaleDictionary";
import { Interval, PitchClass } from "../basics/pitch";
import { estimateScale, Progression, ProgressionValue } from "../editor/progression";
import { AddChordPanel } from "./layout/addChordPanel";
import { ExitGhost, SlotRow } from "./slotRow";

type ProgressionEditorProps = {
	readonly value: ProgressionValue;
	readonly onChange?: (next: ProgressionValue) => void;
};

// ChordModalを開いている間の状態。既存コードの変更ならinitialChordが存在し、
// プレースホルダーへの新規設定ならinitialChordはnullになる
type PendingChordEdit = {
	readonly index: number;
	readonly initialChord: Chord | null;
} | null;

// ContextScaleModalを開いている間の状態。.context-scale-panelはtransformを持ち、position:fixedの
// 包含ブロックになってしまうため、モーダルはPanelの外(ProgressionEditor)側で開閉する必要がある
type PendingScaleEdit = {
	readonly index: number;
	readonly initialValue: ScaleInfo;
} | null;

export function ProgressionEditor(props: ProgressionEditorProps) {
	const { value, onChange } = props;
	const nextIdRef = useRef(0);

	const createId = (): number => {
		const id = nextIdRef.current;
		nextIdRef.current += 1;
		return id;
	};

	const [progression, setProgression] = useState<Progression>(() => Progression.create(value, createId));
	// 直近のinsertで挿入されたスロットのindex。挿入直後のプッシュアニメーションの対象を表す
	// (entry・scaleとも同じindexに挿入される)
	const [insertAnimationIndex, setInsertAnimationIndex] = useState<number | null>(null);
	const [chordExitGhost, setChordExitGhost] = useState<ExitGhost>(null);
	const [scaleExitGhost, setScaleExitGhost] = useState<ExitGhost>(null);
	const [pendingChordEdit, setPendingChordEdit] = useState<PendingChordEdit>(null);
	const [pendingScaleEdit, setPendingScaleEdit] = useState<PendingScaleEdit>(null);

	useEffect(() => {
		setProgression(current => current.sync(value, createId));
	}, [value]);

	const applyProgression = (next: Progression): void => {
		setProgression(next);
		onChange?.(next.value);
	};

	const handleScaleChange = (index: number, scale: ScaleInfo | undefined): void => {
		applyProgression(
			scale === undefined
				? progression.deleteScale(index, createId)
				: progression.setScale(index, scale, createId)
		);
	};

	// 手動設定値があればそれを、なければ直前から継承した値をモーダルの初期状態にする
	const handleEditScale = (index: number): void => {
		const scale = progression.scales.array[index].value;
		const initialValue = scale
			?? estimateScale(progression, index)
			?? new ScaleInfo(PitchClass.all[0], contextScaleNames[0], 0);
		setPendingScaleEdit({ index, initialValue });
	};

	// 未選択(プレースホルダー)を挿入する。実体の選択はAddChordPanelから別途行う。
	// before/afterのボタンはカード・プレースホルダーどちらでも同じ左右の位置にあり、どちらも
	// このinsertだけを呼ぶ(右側はindex + 1を渡すことで「afterへの挿入」を表す)。
	const handleInsert = (index: number): void => {
		applyProgression(progression.insert(index, createId));
		setInsertAnimationIndex(index);
	};

	// 配列のシフトは行わず、未選択(プレースホルダー)に戻すだけ
	const handleDelete = (index: number): void => {
		applyProgression(progression.deleteEntry(index, createId));
	};

	// プレースホルダーそのものを取り除く。あわせてscales[index](entries[index]とentries[index+1]の関係)も
	// 取り除かれる。取り除かれる直前の見た目をExitGhostとしてスナップショットしてから、実際にprogressionを更新する
	const handleShift = (index: number): void => {
		const removedEntry = progression.entries.array[index];
		const removedScale = progression.scales.array[index];

		setChordExitGhost({ id: removedEntry.id, index, node: renderChordContent(index) });
		setScaleExitGhost(
			removedScale ? { id: removedScale.id, index, node: renderScaleContent(index) } : null
		);

		applyProgression(progression.shift(index, createId));
	};

	const handleChangeChord = (index: number, initialChord: Chord): void => {
		setPendingChordEdit({ index, initialChord });
	};

	const handleFillPlaceholder = (index: number): void => {
		setPendingChordEdit({ index, initialChord: null });
	};

	const handleExtraChordScaleTonesChange = (index: number, chord: Chord, nextExtraChordScaleTones: readonly Interval[] | undefined): void => {
		applyProgression(progression.setEntry(index, new ChordEntry(chord, nextExtraChordScaleTones), createId));
		setInsertAnimationIndex(null);
	};

	// カードとプレースホルダーどちらの中身を表示するかは、chord行の描画と(shift時の)ExitGhostの
	// スナップショット取得の両方で使うため、共通の関数として切り出す
	const renderChordContent = (index: number): ReactNode => {
		const entry = progression.entries.array[index].value;
		return entry !== undefined ? (
			<ChordEntryPanel
				entry={entry}
				onChange={next => handleExtraChordScaleTonesChange(index, entry.chord, next)}
				onInsertBefore={() => handleInsert(index)}
				onInsertAfter={() => handleInsert(index + 1)}
				onChangeChord={() => handleChangeChord(index, entry.chord)}
				onDelete={() => handleDelete(index)}
			/>
		) : (
			<AddChordPanel
				onClick={() => handleFillPlaceholder(index)}
				onInsertBefore={() => handleInsert(index)}
				onInsertAfter={index < progression.entries.array.length - 1 ? () => handleInsert(index + 1) : undefined}
				onShift={progression.canShift(index) ? () => handleShift(index) : undefined}
			/>
		);
	};

	// 同上の理由でscale行の中身も共通の関数として切り出す
	const renderScaleContent = (index: number): ReactNode => {
		const formerEntry = progression.entries.array[index]?.value;
		const latterEntry = progression.entries.array[index + 1]?.value;
		const scale = progression.scales.array[index].value;
		return scale !== undefined ? (
			<ContextScalePanel
				formerTriad={formerEntry?.chord.triad}
				latterTriad={latterEntry?.chord.triad}
				contextScale={scale}
				onDelete={index === 0 ? undefined : () => handleScaleChange(index, undefined)}
				onEdit={() => handleEditScale(index)}
			/>
		) : (
			<AutoContextScalePanel
				progression={progression}
				index={index}
				formerTriad={formerEntry?.chord.triad}
				latterTriad={latterEntry?.chord.triad}
				onEdit={() => handleEditScale(index)}
			/>
		);
	};

	return (
		<div className="progression-editor">
			<div className="progression-editor__scroll-area">
				<SlotRow
					className="progression-editor__scale-row"
					items={progression.scales.array}
					renderContent={renderScaleContent}
					insertAnimationIndex={insertAnimationIndex}
					onInsertAnimationEnd={() => setInsertAnimationIndex(null)}
					ghost={scaleExitGhost}
					onGhostAnimationEnd={() => setScaleExitGhost(null)}
				/>
				<SlotRow
					className="progression-editor__chord-row"
					items={progression.entries.array}
					renderContent={renderChordContent}
					insertAnimationIndex={insertAnimationIndex}
					onInsertAnimationEnd={() => setInsertAnimationIndex(null)}
					ghost={chordExitGhost}
					onGhostAnimationEnd={() => setChordExitGhost(null)}
				/>
			</div>
			{pendingChordEdit && (
				<ChordModal
					initialChord={pendingChordEdit.initialChord}
					formerChord={progression.entries.array[pendingChordEdit.index - 1]?.value?.chord}
					latterChord={progression.entries.array[pendingChordEdit.index + 1]?.value?.chord}
					// 前後のcontextScaleは、手動設定がなければ前方から継承した推定値を参照表示する
					formerScale={estimateScale(progression, pendingChordEdit.index - 1)}
					latterScale={estimateScale(progression, pendingChordEdit.index)}
					onConfirm={chord => {
						applyProgression(progression.setEntry(pendingChordEdit.index, new ChordEntry(chord, undefined), createId));
						setPendingChordEdit(null);
					}}
					onCancel={() => setPendingChordEdit(null)}
				/>
			)}
			{pendingScaleEdit && (
				<ContextScaleModal
					value={pendingScaleEdit.initialValue}
					formerChord={progression.entries.array[pendingScaleEdit.index]?.value?.chord}
					latterChord={progression.entries.array[pendingScaleEdit.index + 1]?.value?.chord}
					// 前のスケールは編集位置に効いている継承値(推定)を、次のスケールは明示設定されたもののみを見せる
					// (次を推定すると編集前の自分自身の値が継承されて表示され、紛らわしいため)
					formerScale={estimateScale(progression, pendingScaleEdit.index - 1)}
					latterScale={progression.scales.array[pendingScaleEdit.index + 1]?.value}
					onConfirm={scale => {
						handleScaleChange(pendingScaleEdit.index, scale);
						setPendingScaleEdit(null);
					}}
					onCancel={() => setPendingScaleEdit(null)}
				/>
			)}
		</div>
	);
}
