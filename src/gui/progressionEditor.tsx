import { AnimationEvent, useEffect, useMemo, useRef, useState } from "react";
import { ChordPanel } from "./chordPanel";
import { NexusPanel, DummyNexusPanel } from "./nexusPanel";
import { FullChordInfo } from "../basics/fullChordInfo";
import {
	createProgressionItems,
	insertChordAtIndex,
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

type ProgressionEditorModel = {
	readonly progression: readonly ProgressionItem[];
	readonly shiftAnimation: ShiftAnimationState;
	readonly handleInsert: (index: number, trigger: InsertTrigger) => void;
	readonly handleDelete: (index: number) => void;
	readonly handleChordChange: (index: number, nextChordInfo: FullChordInfo) => void;
	readonly handleSlotAnimationEnd: (event: AnimationEvent<HTMLDivElement>) => void;
};

function createActionButtonClassNames(extraClassName: string): string {
	return `progression-editor__action-button ${extraClassName}`;
}

function useProgressionEditorModel(
	value: readonly FullChordInfo[],
	onChange?: (nextProgression: readonly FullChordInfo[]) => void
): ProgressionEditorModel {
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

	useEffect(() => {
		setProgression(current => syncProgressionItems(current, value, createId));
	}, [value]);

	const handleInsert = (index: number, trigger: InsertTrigger): void => {
		setProgression(current => {
			const next = insertChordAtIndex(current, index, trigger, createId);
			onChange?.(toChordInfos(next));
			return next;
		});
		setShiftAnimation({
			kind: "insert-push",
			targetIndex: index
		});
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

	const handleChordChange = (index: number, nextChordInfo: FullChordInfo): void => {
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

	return {
		progression,
		shiftAnimation,
		handleInsert,
		handleDelete,
		handleChordChange,
		handleSlotAnimationEnd
	};
}

export function ProgressionEditor(props: ProgressionEditorProps) {
	const { value, onChange } = props;
	const {
		progression,
		shiftAnimation,
		handleInsert,
		handleDelete,
		handleChordChange,
		handleSlotAnimationEnd
	} = useProgressionEditorModel(value, onChange);

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
							{index > 0 ? (
								<NexusPanel formerChord={progression[index - 1].chordInfo.chord} latterChord={item.chordInfo.chord} />
							) : (
								<DummyNexusPanel />
							)}
							<div className="progression-editor__panel">
								<div className="progression-editor__panel-actions">
									<button
										type="button"
										className={createActionButtonClassNames("progression-editor__insert-before-button")}
										onClick={() => handleInsert(index, "insertBefore")}
									>
										Insert before
									</button>
									<button
										type="button"
										className={createActionButtonClassNames("progression-editor__insert-after-button")}
										onClick={() => handleInsert(index + 1, "insertAfter")}
									>
										Insert after
									</button>
									<button
										type="button"
										className={createActionButtonClassNames("progression-editor__delete-button")}
										onClick={() => handleDelete(index)}
									>
										Delete
									</button>
								</div>
								<ChordPanel value={item.chordInfo} onChange={nextValue => handleChordChange(index, nextValue)} />
							</div>
						</div>
					))}
					<div className={getSlotClassName(progression.length, "progression-editor__add-item")} onAnimationEnd={handleSlotAnimationEnd}>
						<DummyNexusPanel />
						<div className="progression-editor__panel progression-editor__add-panel">
							<button
								type="button"
								className={createActionButtonClassNames("progression-editor__add-button")}
								onClick={() => handleInsert(progression.length, "add")}
							>
								Add chord
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}