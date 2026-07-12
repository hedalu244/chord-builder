import { AnimationEvent, useEffect, useMemo, useRef, useState } from "react";
import { ChordModal } from "./chordModal";
import { ChordEntryPanel } from "./layout/chordEntryPanel";
import { ContextScaleModal } from "./contextScaleModal";
import { AutoContextScalePanel, ContextScalePanel, DummyContextScalePanel } from "./layout/contextScalePanel";
import { Chord } from "../basics/chord";
import { ChordEntry } from "../basics/chordEntry";
import { ContextScale, estimateContextScale, knownScaleNames } from "../basics/contextScale";
import { Interval, PitchClass } from "../basics/pitch";
import { Progression, ProgressionValue } from "../editor/progression";
import { AddChordPanel } from "./layout/addChordPanel";
import { AddContextScaleButton } from "./layout/addContextScaleButton";

export type ChordEditTrigger = "add" | "changeChord";

type ProgressionEditorProps = {
	readonly value: ProgressionValue;
	readonly onChange?: (next: ProgressionValue) => void;
};

type ShiftAnimationKind = "insert-push" | "delete-shift";

// chordsとcontextsは独立に動くため、実際にアニメーションさせるべき位置(PlaceholderArrayWithIdが
// 実際に操作した位置)もそれぞれ別のindexになりうる。progression.insertBefore/After・shiftBefore/Afterが
// 返すchordIndex/contextIndexをそのまま保持する
type ShiftAnimationState = {
	readonly kind: ShiftAnimationKind;
	readonly chordIndex: number;
	readonly contextIndex: number;
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
	const [shiftAnimation, setShiftAnimation] = useState<ShiftAnimationState>(null);
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

	// 手動設定値があればそれを、なければ前後のコードから自動計算した値をモーダルの初期状態にする
	const handleEditContextScale = (index: number): void => {
		const contextScale = progression.contexts.array[index].value;
		const formerChord = progression.chords.array[index].value?.chord.triad;
		const latterChord = progression.chords.array[index + 1]?.value?.chord.triad;
		const initialValue = contextScale
			?? estimateContextScale(formerChord, latterChord)
			?? new ContextScale(PitchClass.all[0], knownScaleNames[0]);
		setPendingContextScaleEdit({ index, initialValue });
	};

	// 未選択(プレースホルダー)を挿入する。実体の選択はAddChordPanelから別途行う。
	// 実際に挿入された位置はPlaceholderArrayWithId側の都合で要求したindexとずれうるため、
	// アニメーション対象はprogression側が返すchordIndex/contextIndexを使う
	const handleInsertBefore = (index: number): void => {
		const { progression: next, chordIndex, contextIndex } = progression.insertBefore(index, createId);
		applyProgression(next);
		setShiftAnimation({ kind: "insert-push", chordIndex, contextIndex });
	};

	const handleInsertAfter = (index: number): void => {
		const { progression: next, chordIndex, contextIndex } = progression.insertAfter(index, createId);
		applyProgression(next);
		setShiftAnimation({ kind: "insert-push", chordIndex, contextIndex });
	};

	// 配列のシフトは行わず、未選択(プレースホルダー)に戻すだけ
	const handleDelete = (index: number): void => {
		applyProgression(progression.deleteChord(index, createId));
	};

	// プレースホルダーそのものを取り除く。あわせて直後のcontext(chords[index]とchords[index+1]の関係)を取り除く
	const handleShiftAfter = (index: number): void => {
		const { progression: next, chordIndex, contextIndex } = progression.shiftAfter(index, createId);
		applyProgression(next);
		setShiftAnimation({ kind: "delete-shift", chordIndex, contextIndex });
	};

	// プレースホルダーそのものを取り除く。あわせて直前のcontext(chords[index-1]とchords[index]の関係)を取り除く
	const handleShiftBefore = (index: number): void => {
		const { progression: next, chordIndex, contextIndex } = progression.shiftBefore(index, createId);
		applyProgression(next);
		setShiftAnimation({ kind: "delete-shift", chordIndex, contextIndex });
	};

	const handleChangeChord = (index: number, initialChord: Chord): void => {
		setPendingChordEdit({ index, initialChord });
	};

	const handleFillPlaceholder = (index: number): void => {
		setPendingChordEdit({ index, initialChord: null });
	};

	const handleExtraChordScaleTonesChange = (index: number, chord: Chord, nextExtraChordScaleTones: readonly Interval[] | undefined): void => {
		applyProgression(progression.setChord(index, new ChordEntry(chord, nextExtraChordScaleTones), createId));
		setShiftAnimation(null);
	};

	const handleSlotAnimationEnd = (event: AnimationEvent<HTMLDivElement>): void => {
		if (event.currentTarget !== event.target) {
			return;
		}
		setShiftAnimation(null);
	};

	const getSlotClassName = useMemo(
		() => (row: "chord" | "context", slotIndex: number, baseClassName: string): string => {
			const classNames = ["progression-editor__slot", baseClassName];
			const targetIndex = row === "chord" ? shiftAnimation?.chordIndex : shiftAnimation?.contextIndex;
			if (shiftAnimation !== null && targetIndex === slotIndex) {
				if (shiftAnimation.kind === "insert-push") {
					classNames.push("progression-editor__slot--insert-push");
				}
				if (shiftAnimation.kind === "delete-shift") {
					classNames.push("progression-editor__slot--delete-shift");
				}
			}
			return classNames.join(" ");
		},
		[shiftAnimation]
	);

	return (
		<div className="progression-editor">
			<div className="progression-editor__scroll-area">
				<div className="progression-editor__scale-row">
					{progression.contexts.array.map((context, index) => {
						const entry = progression.chords.array[index]?.value;
						const nextEntry = progression.chords.array[index + 1]?.value;
						const contextScale = context.value;
						return (
							<div key={context.id} className={getSlotClassName("context", index, "progression-editor__scale-item")} onAnimationEnd={handleSlotAnimationEnd}>
								{contextScale !== undefined ? (<ContextScalePanel
									formerChord={entry?.chord.triad}
									latterChord={nextEntry?.chord.triad}
									contextScale={contextScale}
									onDelete={() => handleContextScaleChange(index, undefined)}
									onEdit={() => handleEditContextScale(index)}
								/>) :
									(entry !== undefined && nextEntry !== undefined) ? (<AutoContextScalePanel
										formerChord={entry?.chord.triad}
										latterChord={nextEntry?.chord.triad}
										onEdit={() => handleEditContextScale(index)}
									/>)
										: (<AddContextScaleButton onClick={() => handleEditContextScale(index)} />)}
							</div>
						);
					})}
				</div>
				<div className="progression-editor__chord-row">
					{progression.chords.array.map((chord, index) => {
						const entry = chord.value;
						return (
							<div key={chord.id} className={getSlotClassName("chord", index, "progression-editor__chord-item")} onAnimationEnd={handleSlotAnimationEnd}>
								{entry !== undefined ? (
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
										onShiftBefore={progression.canShiftBefore(index) ? () => handleShiftBefore(index) : undefined}
										onShiftAfter={progression.canShiftAfter(index) ? () => handleShiftAfter(index) : undefined}
									/>
								)}
							</div>
						);
					})}
				</div>
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
