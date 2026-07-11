import { AnimationEvent, useEffect, useMemo, useRef, useState } from "react";
import { AddChordPanel } from "./layout/addChordPanel";
import { BasicChordModal } from "./basicChordModal";
import { ChordPanel } from "./layout/chordPanel";
import { NexusChangeModal } from "./nexusChangeModal";
import { NexusPanel, DummyNexusPanel } from "./layout/nexusPanel";
import { FullChordInfo } from "../basics/fullChordInfo";
import { BasicChord } from "../basics/basicChord";
import { DegreeNexus } from "../basics/nexus";
import { Progression } from "../basics/progression";
import { NexusEditBasis } from "./nexusPicker";

type InsertTrigger = "add" | "insertBefore" | "insertAfter";

export type ChordEditTrigger = InsertTrigger | "changeChord";

export type ChordEditContext = {
	readonly formerChord: FullChordInfo | null;
	readonly latterChord: FullChordInfo | null;
	readonly trigger: ChordEditTrigger;
};

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
	readonly context: ChordEditContext;
	readonly initialChord: BasicChord;
} | null;

// 新規コードの挿入(BasicChordModalをadd/insertBefore/insertAfterトリガーで開く)。まだ何も選ばれていない
type PendingChordInsert = {
	readonly index: number;
	readonly context: ChordEditContext;
} | null;

type PendingNexusEdit = {
	readonly slotIndex: number;
} | null;

// BasicChordModalで確定された内容: コードそのものが指定されたか、前後どちらかのコードを基準にnexusが指定されたか
type ChordSpec =
	| { readonly kind: "direct"; readonly chord: BasicChord }
	| { readonly kind: "nexus"; readonly basis: NexusEditBasis; readonly nexus: DegreeNexus };

function resolveByNexus(progression: Progression, gapIndex: number, basis: NexusEditBasis, nexus: DegreeNexus): Progression {
	return basis === "former"
		? progression.setNexusFromFormerChord(gapIndex, nexus)
		: progression.setNexusFromLatterChord(gapIndex, nexus);
}

// コードが新規に挿入される。nexus由来の場合、挿入位置には基準側と同じコードを仮置きし、resolveByNexusが直後に導き直す
function insertBySpec(progression: Progression, index: number, spec: ChordSpec, createId: () => number): Progression {
	if (spec.kind === "direct") {
		return progression.insertChord(index, new FullChordInfo(spec.chord, undefined), createId);
	}
	const gapIndex = spec.basis === "former" ? index - 1 : index;
	const placeholder = new FullChordInfo(progression.items[gapIndex].chordInfo.chord, undefined);
	const inserted = progression.insertChord(index, placeholder, createId);
	return resolveByNexus(inserted, gapIndex, spec.basis, spec.nexus);
}

// 既存のindex位置のコードが変更される
function changeBySpec(progression: Progression, index: number, spec: ChordSpec): Progression {
	if (spec.kind === "direct") {
		return progression.changeChord(index, spec.chord);
	}
	const gapIndex = spec.basis === "former" ? index - 1 : index;
	return resolveByNexus(progression, gapIndex, spec.basis, spec.nexus);
}

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
	const [pendingNexusEdit, setPendingNexusEdit] = useState<PendingNexusEdit>(null);

	useEffect(() => {
		setProgression(current => current.sync(value, createId));
	}, [value]);

	const handleInsert = (index: number, trigger: InsertTrigger): void => {
		const { formerChord, latterChord } = progression.insertionNeighbors(index);
		setPendingChordInsert({ index, context: { formerChord, latterChord, trigger } });
	};

	const handleChange = (index: number): void => {
		const { formerChord, latterChord } = progression.changeNeighbors(index);
		setPendingChordEdit({
			index,
			context: { formerChord, latterChord, trigger: "changeChord" },
			initialChord: progression.items[index].chordInfo.chord
		});
	};

	const applyProgression = (next: Progression): void => {
		setProgression(next);
		onChange?.(next.chordInfos);
	};

	const handleOpenNexusEdit = (slotIndex: number): void => {
		setPendingNexusEdit({ slotIndex });
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
								(<NexusPanel
									formerChord={progression.items[index - 1].chordInfo.chord}
									latterChord={item.chordInfo.chord}
									preferredNexus={item.preferredNexus}
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
					<div className={getSlotClassName(progression.items.length, "progression-editor__add-item")} onAnimationEnd={handleSlotAnimationEnd}>
						<DummyNexusPanel />
						<AddChordPanel onClick={() => handleInsert(progression.items.length, "add")} />
					</div>
				</div>
			</div>
			{pendingChordInsert && (
				<BasicChordModal
					context={pendingChordInsert.context}
					initialChord={null}
					onConfirmDirect={chord => {
						applyProgression(insertBySpec(progression, pendingChordInsert.index, { kind: "direct", chord }, createId));
						setShiftAnimation({ kind: "insert-push", targetIndex: pendingChordInsert.index });
						setPendingChordInsert(null);
					}}
					onConfirmFormerNexus={nexus => {
						applyProgression(insertBySpec(progression, pendingChordInsert.index, { kind: "nexus", basis: "former", nexus }, createId));
						setShiftAnimation({ kind: "insert-push", targetIndex: pendingChordInsert.index });
						setPendingChordInsert(null);
					}}
					onConfirmLatterNexus={nexus => {
						applyProgression(insertBySpec(progression, pendingChordInsert.index, { kind: "nexus", basis: "latter", nexus }, createId));
						setShiftAnimation({ kind: "insert-push", targetIndex: pendingChordInsert.index });
						setPendingChordInsert(null);
					}}
					onCancel={() => setPendingChordInsert(null)}
				/>
			)}
			{pendingChordEdit && (
				<BasicChordModal
					context={pendingChordEdit.context}
					initialChord={pendingChordEdit.initialChord}
					onConfirmDirect={chord => {
						applyProgression(changeBySpec(progression, pendingChordEdit.index, { kind: "direct", chord }));
						setPendingChordEdit(null);
					}}
					onConfirmFormerNexus={nexus => {
						applyProgression(changeBySpec(progression, pendingChordEdit.index, { kind: "nexus", basis: "former", nexus }));
						setPendingChordEdit(null);
					}}
					onConfirmLatterNexus={nexus => {
						applyProgression(changeBySpec(progression, pendingChordEdit.index, { kind: "nexus", basis: "latter", nexus }));
						setPendingChordEdit(null);
					}}
					onCancel={() => setPendingChordEdit(null)}
				/>
			)}
			{pendingNexusEdit && (
				<NexusChangeModal
					formerChord={progression.items[pendingNexusEdit.slotIndex].chordInfo.chord}
					latterChord={progression.items[pendingNexusEdit.slotIndex + 1].chordInfo.chord}
					preferredNexus={progression.items[pendingNexusEdit.slotIndex + 1].preferredNexus}
					onConfirmFixed={nexus => {
						// 両側のコードは動かないのでonChangeは不要
						setProgression(progression.setPreferredNexus(pendingNexusEdit.slotIndex, nexus));
						setPendingNexusEdit(null);
					}}
					onConfirmFormerChord={nexus => {
						// "formerChord"タブ = 前のコードが変わる方式 = 後ろのコードを基準に前を導く
						applyProgression(resolveByNexus(progression, pendingNexusEdit.slotIndex, "latter", nexus));
						setPendingNexusEdit(null);
					}}
					onConfirmLatterChord={nexus => {
						// "latterChord"タブ = 後ろのコードが変わる方式 = 前のコードを基準に後ろを導く
						applyProgression(resolveByNexus(progression, pendingNexusEdit.slotIndex, "former", nexus));
						setPendingNexusEdit(null);
					}}
					onClear={() => {
						setProgression(progression.setPreferredNexus(pendingNexusEdit.slotIndex, undefined));
						setPendingNexusEdit(null);
					}}
					onCancel={() => setPendingNexusEdit(null)}
				/>
			)}
		</div>
	);
}
