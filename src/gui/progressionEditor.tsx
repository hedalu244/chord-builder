import { AnimationEvent, useEffect, useMemo, useRef, useState } from "react";
import { AddChordPanel } from "./addChordPanel";
import { BasicChordModal } from "./basicChordModal";
import { ChordPanel } from "./chordPanel";
import { NexusChangeModal } from "./nexusChangeModal";
import { NexusPanel, DummyNexusPanel } from "./nexusPanel";
import { BasicChord } from "../basics/basicChord";
import { FullChordInfo } from "../basics/fullChordInfo";
import { PitchClass } from "../basics/pitch";
import {
	applyChordEditToPinnedNexi,
	changeChordAtIndex,
	ChordEditContext,
	ChordEditResult,
	createProgressionItems,
	getChangeContext,
	getInsertContext,
	insertChordInfoAtIndex,
	insertNexusSlot,
	InsertTrigger,
	NexusEditResult,
	PinnedNexi,
	ProgressionItem,
	removeChordAtIndex,
	removeNexusSlot,
	replaceChordAtIndex,
	setNexusSlot,
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

type PendingNexusEdit = {
	readonly slotIndex: number;
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
	const [pinnedNexi, setPinnedNexi] = useState<PinnedNexi>(() =>
		new Array(Math.max(0, value.length - 1)).fill(undefined)
	);
	const [shiftAnimation, setShiftAnimation] = useState<ShiftAnimationState>(null);
	const [pendingChordEdit, setPendingChordEdit] = useState<PendingChordEdit>(null);
	const [pendingNexusEdit, setPendingNexusEdit] = useState<PendingNexusEdit>(null);

	useEffect(() => {
		setProgression(current => syncProgressionItems(current, value, createId));
	}, [value]);

	useEffect(() => {
		setPinnedNexi(current => {
			const expectedLength = Math.max(0, progression.length - 1);
			if (current.length === expectedLength) return current;
			return new Array(expectedLength).fill(undefined);
		});
	}, [progression.length]);

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

	const handleConfirmChordEdit = (result: ChordEditResult): void => {
		if (!pendingChordEdit) return;
		const { index, context } = pendingChordEdit;
		const isChange = context.trigger === "changeChord";

		setProgression(current => {
			const next = isChange
				? changeChordAtIndex(current, index, result.chord)
				: insertChordInfoAtIndex(current, index, new FullChordInfo(result.chord, undefined), createId);
			onChange?.(toChordInfos(next));
			return next;
		});
		setPinnedNexi(current => {
			const base = isChange ? current : insertNexusSlot(current, index);
			return applyChordEditToPinnedNexi(base, index, result.method, result.nexus);
		});
		if (!isChange) {
			setShiftAnimation({
				kind: "insert-push",
				targetIndex: index
			});
		}
		setPendingChordEdit(null);
	};

	const handleOpenNexusEdit = (slotIndex: number): void => {
		setPendingNexusEdit({ slotIndex });
	};

	const handleCancelNexusEdit = (): void => {
		setPendingNexusEdit(null);
	};

	const handleConfirmNexusEdit = (result: NexusEditResult): void => {
		if (!pendingNexusEdit) return;
		const { slotIndex } = pendingNexusEdit;
		const { method, nexus } = result;

		if (method !== "fixed") {
			setProgression(current => {
				const next = method === "formerNexus"
					? changeChordAtIndex(current, slotIndex + 1, nexus.resolveLatterChord(current[slotIndex].chordInfo.chord))
					: changeChordAtIndex(current, slotIndex, nexus.resolveFormerChord(current[slotIndex + 1].chordInfo.chord));
				onChange?.(toChordInfos(next));
				return next;
			});
		}

		setPinnedNexi(current => {
			let next = setNexusSlot(current, slotIndex, nexus);
			if (method === "formerNexus") next = setNexusSlot(next, slotIndex + 1, undefined);
			if (method === "latterNexus") next = setNexusSlot(next, slotIndex - 1, undefined);
			return next;
		});
		setPendingNexusEdit(null);
	};

	const handleClearNexus = (slotIndex: number): void => {
		setPinnedNexi(current => setNexusSlot(current, slotIndex, undefined));
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
		setPinnedNexi(current => removeNexusSlot(current, index));
		setShiftAnimation({
			kind: "delete-shift",
			targetIndex: index
		});
	};

	const handleChordInfoChange = (index: number, nextChordInfo: FullChordInfo): void => {
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
								(<NexusPanel
									formerChord={progression[index - 1].chordInfo.chord}
									latterChord={item.chordInfo.chord}
									pinnedNexus={pinnedNexi[index - 1]}
									onEdit={() => handleOpenNexusEdit(index - 1)}
								/>)
								: (<DummyNexusPanel />)}
							<ChordPanel
								value={item.chordInfo}
								onChange={nextValue => handleChordInfoChange(index, nextValue)}
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
			{pendingNexusEdit && (
				<NexusChangeModal
					formerChord={progression[pendingNexusEdit.slotIndex].chordInfo.chord}
					latterChord={progression[pendingNexusEdit.slotIndex + 1].chordInfo.chord}
					pinnedNexus={pinnedNexi[pendingNexusEdit.slotIndex]}
					onConfirm={handleConfirmNexusEdit}
					onClear={() => handleClearNexus(pendingNexusEdit.slotIndex)}
					onCancel={handleCancelNexusEdit}
				/>
			)}
		</div>
	);
}