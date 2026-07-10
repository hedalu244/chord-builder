import { AnimationEvent, useEffect, useMemo, useRef, useState } from "react";
import { AddChordPanel } from "./addChordPanel";
import { BasicChordModal } from "./basicChordModal";
import { ChordPanel } from "./chordPanel";
import { NexusPanel, DummyNexusPanel } from "./nexusPanel";
import { BasicChord } from "../basics/basicChord";
import { FullChordInfo } from "../basics/fullChordInfo";
import { PitchClass } from "../basics/pitch";
import {
	changeChordAtIndex,
	ChordEditContext,
	createProgressionItems,
	getChangeContext,
	getInsertContext,
	insertChordInfoAtIndex,
	InsertTrigger,
	ProgressionItem,
	removeChordAtIndex,
	replaceChordAtIndex,
	syncProgressionItems,
	toChordInfos
} from "../editor";

type ProgressionEditorProps = {
	readonly value: readonly FullChordInfo[];
	readonly onChange?: (nextProgression: readonly FullChordInfo[]) => void;
};

type ShiftAnimationKind = "insert-push" | "delete-shift";

type ShiftAnimationState = {
	readonly kind: ShiftAnimationKind;
	readonly targetIndex: number;
} | null;

type PendingChordEdit = {
	readonly index: number;
	readonly context: ChordEditContext;
	readonly initialChord: BasicChord;
} | null;

export function ProgressionEditor(props: ProgressionEditorProps) {
	const { value, onChange } = props;
	const nextIdRef = useRef(0);

	const createId = (): number => {
		const id = nextIdRef.current;
		nextIdRef.current += 1;
		return id;
	};

	const [progression, setProgression] = useState<readonly ProgressionItem[]>(() =>
		createProgressionItems(value, createId)
	);
	const [shiftAnimation, setShiftAnimation] = useState<ShiftAnimationState>(null);
	const [pendingChordEdit, setPendingChordEdit] = useState<PendingChordEdit>(null);

	useEffect(() => {
		setProgression(current => syncProgressionItems(current, value, createId));
	}, [value]);

	const handleInsert = (index: number, trigger: InsertTrigger): void => {
		setPendingChordEdit({
			index,
			context: getInsertContext(progression, index, trigger),
			initialChord: new BasicChord(new PitchClass(0), "M")
		});
	};

	const handleChange = (index: number): void => {
		setPendingChordEdit({
			index,
			context: getChangeContext(progression, index),
			initialChord: progression[index].chordInfo.chord
		});
	};

	const handleConfirmChordEdit = (chord: BasicChord): void => {
		if (!pendingChordEdit) return;
		const { index, context } = pendingChordEdit;
		const isChange = context.trigger === "changeChord";

		setProgression(current => {
			const next = isChange
				? changeChordAtIndex(current, index, chord)
				: insertChordInfoAtIndex(current, index, new FullChordInfo(chord, undefined), createId);
			onChange?.(toChordInfos(next));
			return next;
		});
		if (!isChange) {
			setShiftAnimation({
				kind: "insert-push",
				targetIndex: index
			});
		}
		setPendingChordEdit(null);
	};

	const handleCancelChordEdit = (): void => {
		setPendingChordEdit(null);
	};

	const handleDelete = (index: number): void => {
		setProgression(current => {
			const next = removeChordAtIndex(current, index);
			onChange?.(toChordInfos(next));
			return next;
		});
		setShiftAnimation({
			kind: "delete-shift",
			targetIndex: index
		});
	};

	const handleQualityChange = (index: number, nextChordInfo: FullChordInfo): void => {
		setProgression(current => {
			const next = replaceChordAtIndex(current, index, nextChordInfo);
			onChange?.(toChordInfos(next));
			return next;
		});
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
				<div className="progression-editor__row">
					{progression.map((item, index) => (
						<div key={item.id} className={getSlotClassName(index, "progression-editor__chord-item")} onAnimationEnd={handleSlotAnimationEnd}>
							{index > 0 ?
								(<NexusPanel formerChord={progression[index - 1].chordInfo.chord} latterChord={item.chordInfo.chord} />)
								: (<DummyNexusPanel />)}
							<ChordPanel
								value={item.chordInfo}
								onQualityChange={nextValue => handleQualityChange(index, nextValue)}
								onInsertBefore={() => handleInsert(index, "insertBefore")}
								onInsertAfter={() => handleInsert(index + 1, "insertAfter")}
								onChangeChord={() => handleChange(index)}
								onDelete={() => handleDelete(index)}
							/>
						</div>
					))}
					<div className={getSlotClassName(progression.length, "progression-editor__add-item")} onAnimationEnd={handleSlotAnimationEnd}>
						<DummyNexusPanel />
						<AddChordPanel onClick={() => handleInsert(progression.length, "add")} />
					</div>
				</div>
			</div>
			{pendingChordEdit && (
				<BasicChordModal
					context={pendingChordEdit.context}
					initialChord={pendingChordEdit.initialChord}
					onConfirm={handleConfirmChordEdit}
					onCancel={handleCancelChordEdit}
				/>
			)}
		</div>
	);
}