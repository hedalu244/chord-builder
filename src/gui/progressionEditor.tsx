import { AnimationEvent, useEffect, useMemo, useRef, useState } from "react";
import { AddChordPanel } from "./layout/addChordPanel";
import { AddContextScaleButton } from "./layout/addContextScaleButton";
import { BasicChordModal } from "./basicChordModal";
import { ChordPanel } from "./layout/chordPanel";
import { ContextScalePanel, DummyContextScalePanel } from "./layout/contextScalePanel";
import { FullChordInfo } from "../basics/fullChordInfo";
import { BasicChord } from "../basics/basicChord";
import { ContextScale, knownScaleNames } from "../basics/contextScale";
import { PitchClass } from "../basics/pitch";
import { Progression } from "../basics/progression";

export type ChordEditTrigger = "add" | "changeChord";

type ProgressionEditorProps = {
	readonly value: readonly (FullChordInfo | undefined)[];
	readonly onChange?: (nextProgression: readonly (FullChordInfo | undefined)[]) => void;
};

type ShiftAnimationKind = "insert-push" | "delete-shift";

type ShiftAnimationState = {
	readonly kind: ShiftAnimationKind;
	readonly targetIndex: number;
} | null;

// 末尾のAddChordPanel(配列外)からの新規追加。BasicChordModalをaddトリガーで開く
type PendingChordAppend = {
	readonly index: number;
} | null;

// BasicChordModalをchangeChord/addトリガーで開く。既存コードの変更ならinitialChordが存在し、
// プレースホルダーへの新規設定ならinitialChordはnullになる
type PendingChordEdit = {
	readonly index: number;
	readonly initialChord: BasicChord | null;
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

	useEffect(() => {
		setProgression(current => current.sync(value, createId));
	}, [value]);

	const applyProgression = (next: Progression): void => {
		setProgression(next);
		onChange?.(next.chordInfos);
	};

	const handleContextScaleChange = (index: number, contextScale: ContextScale | undefined): void => {
		setProgression(progression.setContextScale(index, contextScale));
	};

	// 前後のコードが揃っていない箇所でcontextScaleを手動で設定し始める(初期値は先頭のキー/スケール)
	const handleAddContextScale = (index: number): void => {
		setProgression(progression.setContextScale(index, { key: PitchClass.all[0], name: knownScaleNames[0] }));
	};

	// 未選択(プレースホルダー)を挿入する。実体の選択はAddChordPanelから別途行う
	const handleInsertBefore = (index: number): void => {
		applyProgression(progression.insertChord(index, undefined, createId));
		setShiftAnimation({ kind: "insert-push", targetIndex: index });
	};

	const handleInsertAfter = (index: number): void => {
		const targetIndex = index + 1;
		applyProgression(progression.insertChord(targetIndex, undefined, createId));
		setShiftAnimation({ kind: "insert-push", targetIndex });
	};

	// 配列のシフトは行わず、未選択(プレースホルダー)に戻すだけ
	const handleDelete = (index: number): void => {
		applyProgression(progression.clearChord(index));
	};

	// プレースホルダーそのものを取り除く
	const handleShrink = (index: number): void => {
		applyProgression(progression.removeItem(index));
		setShiftAnimation({ kind: "delete-shift", targetIndex: index });
	};

	const handleChangeChord = (index: number, initialChord: BasicChord): void => {
		setPendingChordEdit({ index, initialChord });
	};

	const handleFillPlaceholder = (index: number): void => {
		setPendingChordEdit({ index, initialChord: null });
	};

	const handleAppend = (): void => {
		setPendingChordAppend({ index: progression.items.length });
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
					{progression.items.map((item, index) => {
						const chordInfo = item.chordInfo;
						const nextChordInfo = progression.items[index + 1]?.chordInfo;
						const contextScale = item.contextScale;
						return (
							<div key={item.id} className={getSlotClassName(index, "progression-editor__chord-item")} onAnimationEnd={handleSlotAnimationEnd}>
								{(contextScale !== undefined || (chordInfo !== undefined && nextChordInfo !== undefined)) ?
									(<ContextScalePanel
										formerChord={chordInfo?.chord}
										latterChord={nextChordInfo?.chord}
										contextScale={contextScale}
										onChange={cs => handleContextScaleChange(index, cs)}
									/>)
									: (<AddContextScaleButton onClick={() => handleAddContextScale(index)} />)}
								{chordInfo !== undefined ? (
									<ChordPanel
										value={chordInfo}
										onChange={nextValue => handleChordInfoChange(index, nextValue)}
										onInsertBefore={() => handleInsertBefore(index)}
										onInsertAfter={() => handleInsertAfter(index)}
										onChangeChord={() => handleChangeChord(index, chordInfo.chord)}
										onDelete={() => handleDelete(index)}
									/>
								) : (
									<AddChordPanel onClick={() => handleFillPlaceholder(index)} onShrink={() => handleShrink(index)} />
								)}
							</div>
						);
					})}
					<div className={getSlotClassName(progression.items.length, "progression-editor__add-item")} onAnimationEnd={handleSlotAnimationEnd}>
						<DummyContextScalePanel />
						<AddChordPanel onClick={handleAppend} />
					</div>
				</div>
			</div>
			{pendingChordAppend && (
				<BasicChordModal
					trigger="add"
					initialChord={null}
					onConfirm={chord => {
						applyProgression(progression.insertChord(pendingChordAppend.index, new FullChordInfo(chord, undefined), createId));
						setShiftAnimation({ kind: "insert-push", targetIndex: pendingChordAppend.index });
						setPendingChordAppend(null);
					}}
					onCancel={() => setPendingChordAppend(null)}
				/>
			)}
			{pendingChordEdit && (
				<BasicChordModal
					trigger={pendingChordEdit.initialChord === null ? "add" : "changeChord"}
					initialChord={pendingChordEdit.initialChord}
					onConfirm={chord => {
						applyProgression(progression.setChord(pendingChordEdit.index, chord));
						setPendingChordEdit(null);
					}}
					onCancel={() => setPendingChordEdit(null)}
				/>
			)}
		</div>
	);
}
