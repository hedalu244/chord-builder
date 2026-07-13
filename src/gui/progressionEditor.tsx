import { AnimationEvent, ReactNode, useEffect, useRef, useState } from "react";
import { ChordModal } from "./chordModal";
import { ChordEntryPanel } from "./layout/chordEntryPanel";
import { ContextScaleModal } from "./contextScaleModal";
import { AutoContextScalePanel, ContextScalePanel } from "./layout/contextScalePanel";
import { Chord } from "../basics/chord";
import { ChordEntry } from "../basics/chordEntry";
import { ContextScale, knownScaleNames } from "../basics/contextScale";
import { Interval, PitchClass } from "../basics/pitch";
import { estimateContextScale, Progression, ProgressionValue } from "../editor/progression";
import { AddChordPanel } from "./layout/addChordPanel";

type ProgressionEditorProps = {
	readonly value: ProgressionValue;
	readonly onChange?: (next: ProgressionValue) => void;
};

// shiftで取り除かれた直後の要素は、配列からは既に消えているが、フェードアウト+幅つぶれの
// アニメーションが終わるまでは見た目上その場に残しておきたい。取り除かれる直前の見た目を
// (非操作的なコピーとして)スナップショットして保持し、アニメーション終了で消し去る。
// indexは取り除かれた(=今はその位置に後続の要素が詰めてきている)位置を指す。
type ExitGhost = {
	readonly id: number;
	readonly index: number;
	readonly node: ReactNode;
} | null;

// ChordModalを開いている間の状態。既存コードの変更ならinitialChordが存在し、
// プレースホルダーへの新規設定ならinitialChordはnullになる
type PendingChordEdit = {
	readonly index: number;
	readonly initialChord: Chord | null;
} | null;

// ContextScaleModalを開いている間の状態。.context-scale-panelはtransformを持ち、position:fixedの
// 包含ブロックになってしまうため、モーダルはPanelの外(ProgressionEditor)側で開閉する必要がある
type PendingContextScaleEdit = {
	readonly index: number;
	readonly initialValue: ContextScale;
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
	// (entry・contextとも同じindexに挿入される)
	const [insertAnimationIndex, setInsertAnimationIndex] = useState<number | null>(null);
	const [chordExitGhost, setChordExitGhost] = useState<ExitGhost>(null);
	const [contextExitGhost, setContextExitGhost] = useState<ExitGhost>(null);
	const [pendingChordEdit, setPendingChordEdit] = useState<PendingChordEdit>(null);
	const [pendingContextScaleEdit, setPendingContextScaleEdit] = useState<PendingContextScaleEdit>(null);

	useEffect(() => {
		setProgression(current => current.sync(value, createId));
	}, [value]);

	const applyProgression = (next: Progression): void => {
		setProgression(next);
		onChange?.(next.value);
	};

	const handleContextScaleChange = (index: number, contextScale: ContextScale | undefined): void => {
		setProgression(
			contextScale === undefined
				? progression.deleteContextScale(index, createId)
				: progression.setContextScale(index, contextScale, createId)
		);
	};

	// 手動設定値があればそれを、なければ直前から継承した値をモーダルの初期状態にする
	const handleEditContextScale = (index: number): void => {
		const contextScale = progression.contexts.array[index].value;
		const initialValue = contextScale
			?? estimateContextScale(progression, index)
			?? new ContextScale(PitchClass.all[0], knownScaleNames[0]);
		setPendingContextScaleEdit({ index, initialValue });
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

	// プレースホルダーそのものを取り除く。あわせてcontexts[index](entries[index]とentries[index+1]の関係)も
	// 取り除かれる。取り除かれる直前の見た目をExitGhostとしてスナップショットしてから、実際にprogressionを更新する
	const handleShift = (index: number): void => {
		const removedEntry = progression.entries.array[index];
		const removedContext = progression.contexts.array[index];

		setChordExitGhost({ id: removedEntry.id, index, node: renderChordContent(index) });
		setContextExitGhost(
			removedContext ? { id: removedContext.id, index, node: renderContextContent(index) } : null
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

	const handleSlotAnimationEnd = (event: AnimationEvent<HTMLDivElement>): void => {
		if (event.currentTarget !== event.target) {
			return;
		}
		setInsertAnimationIndex(null);
	};

	const handleGhostAnimationEnd = (row: "chord" | "context") => (event: AnimationEvent<HTMLDivElement>): void => {
		if (event.currentTarget !== event.target) {
			return;
		}
		if (row === "chord") {
			setChordExitGhost(null);
		} else {
			setContextExitGhost(null);
		}
	};

	const getSlotClassName = (slotIndex: number): string => {
		return insertAnimationIndex === slotIndex
			? "progression-editor__slot progression-editor__slot--insert-push"
			: "progression-editor__slot";
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

	// 同上の理由でcontext行の中身も共通の関数として切り出す
	const renderContextContent = (index: number): ReactNode => {
		const formerEntry = progression.entries.array[index]?.value;
		const latterEntry = progression.entries.array[index + 1]?.value;
		const contextScale = progression.contexts.array[index].value;
		return contextScale !== undefined ? (
			<ContextScalePanel
				formerTriad={formerEntry?.chord.triad}
				latterTriad={latterEntry?.chord.triad}
				contextScale={contextScale}
				onDelete={index === 0 ? undefined : () => handleContextScaleChange(index, undefined)}
				onEdit={() => handleEditContextScale(index)}
			/>
		) : (
			<AutoContextScalePanel
				progression={progression}
				index={index}
				formerTriad={formerEntry?.chord.triad}
				latterTriad={latterEntry?.chord.triad}
				onEdit={() => handleEditContextScale(index)}
			/>
		);
	};

	// 1行分のスロット列を組み立てる。ExitGhostはghost.indexの位置(または末尾)に、
	// 通常のスロットと同じ見た目で差し込む
	const buildRowNodes = (
		items: readonly { readonly id: number }[],
		ghost: ExitGhost,
		row: "chord" | "context",
		renderContent: (index: number) => ReactNode
	): ReactNode[] => {
		const renderGhost = (currentGhost: NonNullable<ExitGhost>): ReactNode => (
			<div
				key={`ghost-${currentGhost.id}`}
				className="progression-editor__slot progression-editor__slot--exiting"
				onAnimationEnd={handleGhostAnimationEnd(row)}
			>
				{currentGhost.node}
			</div>
		);

		const nodes: ReactNode[] = [];
		items.forEach((item, index) => {
			if (ghost && ghost.index === index) {
				nodes.push(renderGhost(ghost));
			}
			nodes.push(
				<div key={item.id} className={getSlotClassName(index)} onAnimationEnd={handleSlotAnimationEnd}>
					{renderContent(index)}
				</div>
			);
		});
		if (ghost && ghost.index === items.length) {
			nodes.push(renderGhost(ghost));
		}
		return nodes;
	};

	return (
		<div className="progression-editor">
			<div className="progression-editor__scroll-area">
				<div className="progression-editor__scale-row">
					{buildRowNodes(progression.contexts.array, contextExitGhost, "context", renderContextContent)}
				</div>
				<div className="progression-editor__chord-row">
					{buildRowNodes(progression.entries.array, chordExitGhost, "chord", renderChordContent)}
				</div>
			</div>
			{pendingChordEdit && (
				<ChordModal
					initialChord={pendingChordEdit.initialChord}
					prevChord={progression.entries.array[pendingChordEdit.index - 1]?.value?.chord}
					nextChord={progression.entries.array[pendingChordEdit.index + 1]?.value?.chord}
					// 前後のcontextScaleは、手動設定がなければ前方から継承した推定値を参照表示する
					contextBefore={estimateContextScale(progression, pendingChordEdit.index - 1)}
					contextAfter={estimateContextScale(progression, pendingChordEdit.index)}
					onConfirm={chord => {
						applyProgression(progression.setEntry(pendingChordEdit.index, new ChordEntry(chord, undefined), createId));
						setPendingChordEdit(null);
					}}
					onCancel={() => setPendingChordEdit(null)}
				/>
			)}
			{pendingContextScaleEdit && (
				<ContextScaleModal
					value={pendingContextScaleEdit.initialValue}
					formerTriad={progression.entries.array[pendingContextScaleEdit.index]?.value?.chord.triad}
					latterTriad={progression.entries.array[pendingContextScaleEdit.index + 1]?.value?.chord.triad}
					onConfirm={contextScale => {
						handleContextScaleChange(pendingContextScaleEdit.index, contextScale);
						setPendingContextScaleEdit(null);
					}}
					onCancel={() => setPendingContextScaleEdit(null)}
				/>
			)}
		</div>
	);
}
