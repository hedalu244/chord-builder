import { AnimationEvent, useEffect, useMemo, useRef, useState } from "react";
import { AddChordPanel } from "./layout/addChordPanel";
import { AddContextScaleButton } from "./layout/addContextScaleButton";
import { ChordModal } from "./chordModal";
import { ChordEntryPanel } from "./layout/chordEntryPanel";
import { ContextScaleModal } from "./contextScaleModal";
import { ContextScalePanel, DummyContextScalePanel } from "./layout/contextScalePanel";
import { Chord } from "../basics/chord";
import { ChordEntry } from "../basics/chordEntry";
import { ContextScale, estimateContextScale, knownScaleNames } from "../basics/contextScale";
import { Interval, PitchClass } from "../basics/pitch";
import { Progression, ProgressionValue } from "../basics/progression";

export type ChordEditTrigger = "add" | "changeChord";

type ProgressionEditorProps = {
	readonly value: ProgressionValue;
	readonly onChange?: (next: ProgressionValue) => void;
};

type ShiftAnimationKind = "insert-push" | "delete-shift";

type ShiftAnimationState = {
	readonly kind: ShiftAnimationKind;
	readonly targetIndex: number;
} | null;

// 末尾のAddChordPanel(配列外)からの新規追加。ChordModalをaddトリガーで開く
type PendingChordAppend = {
	readonly index: number;
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
	const [pendingChordAppend, setPendingChordAppend] = useState<PendingChordAppend>(null);
	const [pendingContextScaleEdit, setPendingContextScaleEdit] = useState<PendingContextScaleEdit>(null);

	useEffect(() => {
		setProgression(current => current.sync(value, createId));
	}, [value]);

	const applyProgression = (next: Progression): void => {
		setProgression(next);
		onChange?.(next.value);
	};

	const handleContextScaleChange = (index: number, contextScale: ContextScale | undefined): void => {
		setProgression(progression.setContextScale(index, contextScale));
	};

	// 手動設定値があればそれを、なければ前後のコードから自動計算した値をモーダルの初期状態にする
	const handleEditContextScale = (index: number): void => {
		const contextScale = progression.contexts[index].contextScale;
		const formerChord = progression.chords[index].entry?.chord.triad;
		const latterChord = progression.chords[index + 1]?.entry?.chord.triad;
		const initialValue = contextScale
			?? (formerChord && latterChord ? estimateContextScale(formerChord, latterChord) : new ContextScale(PitchClass.all[0], knownScaleNames[0]));
		setPendingContextScaleEdit({ index, initialValue });
	};

	// 前後のコードが揃っていない箇所でcontextScaleを手動で設定し始める(初期値は先頭のキー/スケール)
	const handleAddContextScale = (index: number): void => {
		setProgression(progression.setContextScale(index, new ContextScale(PitchClass.all[0], knownScaleNames[0])));
	};

	// 未選択(プレースホルダー)を挿入する。実体の選択はAddChordPanelから別途行う
	const handleInsertBefore = (index: number): void => {
		applyProgression(progression.insert(index, createId));
		setShiftAnimation({ kind: "insert-push", targetIndex: index });
	};

	const handleInsertAfter = (index: number): void => {
		const targetIndex = index + 1;
		applyProgression(progression.insert(targetIndex, createId));
		setShiftAnimation({ kind: "insert-push", targetIndex });
	};

	// 配列のシフトは行わず、未選択(プレースホルダー)に戻すだけ
	const handleDelete = (index: number): void => {
		applyProgression(progression.setChord(index, undefined));
	};

	// プレースホルダーそのものを取り除く
	const handleShift = (index: number): void => {
		applyProgression(progression.shift(index));
		setShiftAnimation({ kind: "delete-shift", targetIndex: index });
	};

	const handleChangeChord = (index: number, initialChord: Chord): void => {
		setPendingChordEdit({ index, initialChord });
	};

	const handleFillPlaceholder = (index: number): void => {
		setPendingChordEdit({ index, initialChord: null });
	};

	const handleAppend = (): void => {
		setPendingChordAppend({ index: progression.chords.length });
	};

	const handleExtraChordScaleTonesChange = (index: number, chord: Chord, nextExtraChordScaleTones: readonly Interval[] | undefined): void => {
		applyProgression(progression.setChord(index, new ChordEntry(chord, nextExtraChordScaleTones)));
		setShiftAnimation(null);
	};

	const handleSlotAnimationEnd = (event: AnimationEvent<HTMLDivElement>): void => {
		if (event.currentTarget !== event.target) {
			return;
		}
		setShiftAnimation(null);
	};

	const getSlotClassName = useMemo(
		() => (slotIndex: number, baseClassName: string): string => {
			const classNames = ["progression-editor__slot", baseClassName];
			if (shiftAnimation?.targetIndex === slotIndex) {
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
					{progression.contexts.map((context, index) => {
						const entry = progression.chords[index]?.entry;
						const nextEntry = progression.chords[index + 1]?.entry;
						const contextScale = context.contextScale;
						return (
							<div key={context.id} className={getSlotClassName(index, "progression-editor__scale-item")} onAnimationEnd={handleSlotAnimationEnd}>
								{(contextScale !== undefined || (entry !== undefined && nextEntry !== undefined)) ?
									(<ContextScalePanel
										formerChord={entry?.chord.triad}
										latterChord={nextEntry?.chord.triad}
										contextScale={contextScale}
										onChange={cs => handleContextScaleChange(index, cs)}
										onEdit={() => handleEditContextScale(index)}
									/>)
									: (<AddContextScaleButton onClick={() => handleAddContextScale(index)} />)}
							</div>
						);
					})}
					<div className={getSlotClassName(progression.chords.length, "progression-editor__add-item")} onAnimationEnd={handleSlotAnimationEnd}>
						<DummyContextScalePanel />
					</div>
				</div>
				<div className="progression-editor__chord-row">
					{progression.chords.map((chord, index) => {
						const entry = chord.entry;
						return (
							<div key={chord.id} className={getSlotClassName(index, "progression-editor__chord-item")} onAnimationEnd={handleSlotAnimationEnd}>
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
									<AddChordPanel onClick={() => handleFillPlaceholder(index)} onShift={() => handleShift(index)} />
								)}
							</div>
						);
					})}
					<div className={getSlotClassName(progression.chords.length, "progression-editor__add-item")} onAnimationEnd={handleSlotAnimationEnd}>
						<AddChordPanel onClick={handleAppend} />
					</div>
				</div>
			</div>
			{pendingChordAppend && (
				<ChordModal
					trigger="add"
					initialChord={null}
					onConfirm={chord => {
						const inserted = progression.insert(pendingChordAppend.index, createId);
						applyProgression(inserted.setChord(pendingChordAppend.index, new ChordEntry(chord, undefined)));
						setShiftAnimation({ kind: "insert-push", targetIndex: pendingChordAppend.index });
						setPendingChordAppend(null);
					}}
					onCancel={() => setPendingChordAppend(null)}
				/>
			)}
			{pendingChordEdit && (
				<ChordModal
					trigger={pendingChordEdit.initialChord === null ? "add" : "changeChord"}
					initialChord={pendingChordEdit.initialChord}
					onConfirm={chord => {
						applyProgression(progression.setChord(pendingChordEdit.index, new ChordEntry(chord, undefined)));
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
