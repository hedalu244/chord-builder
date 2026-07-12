import { AnimationEvent, useEffect, useMemo, useRef, useState } from "react";
import { AddChordPanel } from "./layout/addChordPanel";
import { BasicChordModal } from "./basicChordModal";
import { ChordPanel } from "./layout/chordPanel";
import { ContextScalePanel, DummyContextScalePanel } from "./layout/contextScalePanel";
import { FullChordInfo } from "../basics/fullChordInfo";
import { BasicChord } from "../basics/basicChord";
import { ContextScale } from "../basics/contextScale";
import { Progression } from "../basics/progression";

type InsertTrigger = "add" | "insertBefore" | "insertAfter";

export type ChordEditTrigger = InsertTrigger | "changeChord";

type ProgressionEditorProps = {
	readonly value: readonly FullChordInfo[];
	readonly onChange?: (nextProgression: readonly FullChordInfo[]) => void;
};

type ShiftAnimationKind = "insert-push" | "delete-shift";

type ShiftAnimationState = {
	readonly kind: ShiftAnimationKind;
	readonly targetIndex: number;
} | null;

// 既存コードの変更(BasicChordModalをchangeChordトリガーで開く)。対象は常に既存なのでinitialChordは必ず存在する
type PendingChordEdit = {
	readonly index: number;
	readonly initialChord: BasicChord;
} | null;

// 新規コードの挿入(BasicChordModalをadd/insertBefore/insertAfterトリガーで開く)。まだ何も選ばれていない
type PendingChordInsert = {
	readonly index: number;
	readonly trigger: InsertTrigger;
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
	const [pendingChordInsert, setPendingChordInsert] = useState<PendingChordInsert>(null);

	useEffect(() => {
		setProgression(current => current.sync(value, createId));
	}, [value]);

	const handleInsert = (index: number, trigger: InsertTrigger): void => {
		setPendingChordInsert({ index, trigger });
	};

	const handleChange = (index: number): void => {
		setPendingChordEdit({ index, initialChord: progression.items[index].chordInfo.chord });
	};

	const applyProgression = (next: Progression): void => {
		setProgression(next);
		onChange?.(next.chordInfos);
	};

	const handleContextScaleChange = (index: number, contextScale: ContextScale | undefined): void => {
		setProgression(progression.setContextScale(index, contextScale));
	};

	const handleDelete = (index: number): void => {
		applyProgression(progression.removeChord(index));
		setShiftAnimation({
			kind: "delete-shift",
			targetIndex: index
		});
	};

	const handleChordInfoChange = (index: number, nextChordInfo: FullChordInfo): void => {
		applyProgression(progression.updateChordInfo(index, nextChordInfo));
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
					{progression.items.map((item, index) => (
						<div key={item.id} className={getSlotClassName(index, "progression-editor__chord-item")} onAnimationEnd={handleSlotAnimationEnd}>
							{index > 0 ?
								(<ContextScalePanel
									formerChord={progression.items[index - 1].chordInfo.chord}
									latterChord={item.chordInfo.chord}
									contextScale={item.contextScale}
									onChange={contextScale => handleContextScaleChange(index, contextScale)}
								/>)
								: (<DummyContextScalePanel />)}
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
					<div className={getSlotClassName(progression.items.length, "progression-editor__add-item")} onAnimationEnd={handleSlotAnimationEnd}>
						<DummyContextScalePanel />
						<AddChordPanel onClick={() => handleInsert(progression.items.length, "add")} />
					</div>
				</div>
			</div>
			{pendingChordInsert && (
				<BasicChordModal
					trigger={pendingChordInsert.trigger}
					initialChord={null}
					onConfirm={chord => {
						applyProgression(progression.insertChord(pendingChordInsert.index, new FullChordInfo(chord, undefined), createId));
						setShiftAnimation({ kind: "insert-push", targetIndex: pendingChordInsert.index });
						setPendingChordInsert(null);
					}}
					onCancel={() => setPendingChordInsert(null)}
				/>
			)}
			{pendingChordEdit && (
				<BasicChordModal
					trigger="changeChord"
					initialChord={pendingChordEdit.initialChord}
					onConfirm={chord => {
						applyProgression(progression.changeChord(pendingChordEdit.index, chord));
						setPendingChordEdit(null);
					}}
					onCancel={() => setPendingChordEdit(null)}
				/>
			)}
		</div>
	);
}
