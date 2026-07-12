import { AnimationEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ChordModal } from "./chordModal";
import { ChordEntryPanel } from "./layout/chordEntryPanel";
import { ContextScaleModal } from "./contextScaleModal";
import { AutoContextScalePanel, ContextScalePanel } from "./layout/contextScalePanel";
import { Chord } from "../basics/chord";
import { ChordEntry } from "../basics/chordEntry";
import { ContextScale, knownScaleNames } from "../basics/contextScale";
import { Interval, PitchClass } from "../basics/pitch";
import { ChordWithId, ContextWithId, estimateContextScale, Progression, ProgressionValue } from "../editor/progression";
import { AddChordPanel } from "./layout/addChordPanel";

export type ChordEditTrigger = "add" | "changeChord";

type ProgressionEditorProps = {
	readonly value: ProgressionValue;
	readonly onChange?: (next: ProgressionValue) => void;
};

// chordsとcontextsは独立に動くため、実際にアニメーションさせるべき位置(PlaceholderArrayWithIdが
// 実際に操作した位置)もそれぞれ別のindexになりうる。progression.insertが
// 返すchordIndex/contextIndexをそのまま保持する
type InsertAnimationState = {
	readonly chordIndex: number;
	readonly contextIndex: number;
} | null;

// shiftで取り除かれた直後の要素は、配列からは既に消えているが、フェードアウト+幅つぶれの
// アニメーションが終わるまでは見た目上その場に残しておきたい。取り除かれる直前の見た目を
// (非操作的なコピーとして)スナップショットして保持し、アニメーション終了で消し去る。
// indexは取り除かれた(=今はその位置に後続の要素が詰めてきている)位置を指す。
type ExitGhost = {
	readonly id: number;
	readonly index: number;
	readonly node: ReactNode;
} | null;

// ChordModalをchangeChord/addトリガーで開く。既存コードの変更ならinitialChordが存在し、
// プレースホルダーへの新規設定ならinitialChordはnullになる
type PendingChordEdit = {
	readonly index: number;
	readonly initialChord: Chord | null;
} | null;

// ContextScaleModalをchangeトリガーで開く。.context-scale-panelはtransformを持ち、position:fixedの
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
	const [insertAnimation, setInsertAnimation] = useState<InsertAnimationState>(null);
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
	// 実際に挿入された位置はPlaceholderArrayWithId側の都合で要求したindexとずれうるため、
	// アニメーション対象はprogression側が返すchordIndex/contextIndexを使う。
	// before/afterのボタンはカード・プレースホルダーどちらでも同じ左右の位置にあり、どちらも
	// このinsertだけを呼ぶ(右側はindex + 1を渡すことで「afterへの挿入」を表す)。
	const handleInsertBefore = (index: number): void => {
		const { progression: next, chordIndex, contextIndex } = progression.insert(index, createId);
		applyProgression(next);
		setInsertAnimation({ chordIndex, contextIndex });
	};

	const handleInsertAfter = (index: number): void => {
		const { progression: next, chordIndex, contextIndex } = progression.insert(index + 1, createId);
		applyProgression(next);
		setInsertAnimation({ chordIndex, contextIndex });
	};

	// 配列のシフトは行わず、未選択(プレースホルダー)に戻すだけ
	const handleDelete = (index: number): void => {
		applyProgression(progression.deleteChord(index, createId));
	};

	// プレースホルダーそのものを取り除く。あわせて直前のcontext(chords[index-1]とchords[index]の関係)を取り除く。
	// 取り除かれる直前の見た目をExitGhostとしてスナップショットしてから、実際にprogressionを更新する
	const handleShift = (index: number): void => {
		const removedChord = progression.chords.array[index];
		const removedContext = progression.contexts.array[index];

		setChordExitGhost({ id: removedChord.id, index, node: renderChordContent(removedChord, index) });
		setContextExitGhost(
			removedContext ? { id: removedContext.id, index, node: renderContextContent(removedContext, index) } : null
		);

		const { progression: next } = progression.shift(index, createId);
		applyProgression(next);
	};

	const handleChangeChord = (index: number, initialChord: Chord): void => {
		setPendingChordEdit({ index, initialChord });
	};

	const handleFillPlaceholder = (index: number): void => {
		setPendingChordEdit({ index, initialChord: null });
	};

	const handleExtraChordScaleTonesChange = (index: number, chord: Chord, nextExtraChordScaleTones: readonly Interval[] | undefined): void => {
		applyProgression(progression.setChord(index, new ChordEntry(chord, nextExtraChordScaleTones), createId));
		setInsertAnimation(null);
	};

	const handleSlotAnimationEnd = (event: AnimationEvent<HTMLDivElement>): void => {
		if (event.currentTarget !== event.target) {
			return;
		}
		setInsertAnimation(null);
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

	const getSlotClassName = useMemo(
		() => (row: "chord" | "context", slotIndex: number, baseClassName: string): string => {
			const classNames = ["progression-editor__slot", baseClassName];
			const targetIndex = row === "chord" ? insertAnimation?.chordIndex : insertAnimation?.contextIndex;
			if (insertAnimation !== null && targetIndex === slotIndex) {
				classNames.push("progression-editor__slot--insert-push");
			}
			return classNames.join(" ");
		},
		[insertAnimation]
	);

	// カードとプレースホルダーどちらの中身を表示するかは、chords行の描画と(shift時の)ExitGhostの
	// スナップショット取得の両方で使うため、共通の関数として切り出す
	const renderChordContent = (chord: ChordWithId, index: number): ReactNode => {
		const entry = chord.value;
		return entry !== undefined ? (
			<ChordEntryPanel
				entry={entry}
				onChange={next => handleExtraChordScaleTonesChange(index, entry.chord, next)}
				onInsertBefore={() => handleInsertBefore(index)}
				onInsertAfter={() => handleInsertAfter(index)}
				onChangeChord={() => handleChangeChord(index, entry.chord)}
				onDelete={() => handleDelete(index)}
			/>
		) : (
			<AddChordPanel
				onClick={() => handleFillPlaceholder(index)}
				onInsertBefore={() => handleInsertBefore(index)}
				onInsertAfter={index < progression.chords.array.length - 1 ? () => handleInsertAfter(index) : undefined}
				onShift={progression.canShift(index) ? () => handleShift(index) : undefined}
			/>
		);
	};

	// 同上の理由でcontexts行の中身も共通の関数として切り出す
	const renderContextContent = (context: ContextWithId, index: number): ReactNode => {
		const entry = progression.chords.array[index]?.value;
		const nextEntry = progression.chords.array[index + 1]?.value;
		const contextScale = context.value;
		return contextScale !== undefined ? (
			<ContextScalePanel
				formerChord={entry?.chord.triad}
				latterChord={nextEntry?.chord.triad}
				contextScale={contextScale}
				onDelete={index === 0 ? undefined : () => handleContextScaleChange(index, undefined)}
				onEdit={() => handleEditContextScale(index)}
			/>
		) : (
			<AutoContextScalePanel
				progression={progression}
				index={index}
				formerChord={entry?.chord.triad}
				latterChord={nextEntry?.chord.triad}
				onEdit={() => handleEditContextScale(index)}
			/>
		);
	};

	const contextRowNodes: ReactNode[] = [];
	progression.contexts.array.forEach((context, index) => {
		if (contextExitGhost && contextExitGhost.index === index) {
			contextRowNodes.push(
				<div
					key={`ghost-${contextExitGhost.id}`}
					className="progression-editor__slot progression-editor__scale-item progression-editor__slot--exiting"
					onAnimationEnd={handleGhostAnimationEnd("context")}
				>
					{contextExitGhost.node}
				</div>
			);
		}
		contextRowNodes.push(
			<div key={context.id} className={getSlotClassName("context", index, "progression-editor__scale-item")} onAnimationEnd={handleSlotAnimationEnd}>
				{renderContextContent(context, index)}
			</div>
		);
	});
	if (contextExitGhost && contextExitGhost.index === progression.contexts.array.length) {
		contextRowNodes.push(
			<div
				key={`ghost-${contextExitGhost.id}`}
				className="progression-editor__slot progression-editor__scale-item progression-editor__slot--exiting"
				onAnimationEnd={handleGhostAnimationEnd("context")}
			>
				{contextExitGhost.node}
			</div>
		);
	}

	const chordRowNodes: ReactNode[] = [];
	progression.chords.array.forEach((chord, index) => {
		if (chordExitGhost && chordExitGhost.index === index) {
			chordRowNodes.push(
				<div
					key={`ghost-${chordExitGhost.id}`}
					className="progression-editor__slot progression-editor__chord-item progression-editor__slot--exiting"
					onAnimationEnd={handleGhostAnimationEnd("chord")}
				>
					{chordExitGhost.node}
				</div>
			);
		}
		chordRowNodes.push(
			<div key={chord.id} className={getSlotClassName("chord", index, "progression-editor__chord-item")} onAnimationEnd={handleSlotAnimationEnd}>
				{renderChordContent(chord, index)}
			</div>
		);
	});
	if (chordExitGhost && chordExitGhost.index === progression.chords.array.length) {
		chordRowNodes.push(
			<div
				key={`ghost-${chordExitGhost.id}`}
				className="progression-editor__slot progression-editor__chord-item progression-editor__slot--exiting"
				onAnimationEnd={handleGhostAnimationEnd("chord")}
			>
				{chordExitGhost.node}
			</div>
		);
	}

	return (
		<div className="progression-editor">
			<div className="progression-editor__scroll-area">
				<div className="progression-editor__scale-row">{contextRowNodes}</div>
				<div className="progression-editor__chord-row">{chordRowNodes}</div>
			</div>
			{pendingChordEdit && (
				<ChordModal
					trigger={pendingChordEdit.initialChord === null ? "add" : "changeChord"}
					initialChord={pendingChordEdit.initialChord}
					onConfirm={chord => {
						applyProgression(progression.setChord(pendingChordEdit.index, new ChordEntry(chord, undefined), createId));
						setPendingChordEdit(null);
					}}
					onCancel={() => setPendingChordEdit(null)}
				/>
			)}
			{pendingContextScaleEdit && (
				<ContextScaleModal
					value={pendingContextScaleEdit.initialValue}
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
