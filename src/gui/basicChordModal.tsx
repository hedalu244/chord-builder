import { useState } from "react";
import { allBasicChords, BasicChord } from "../basics/basicChord";
import { DegreeNexus } from "../basics/nexus";
import { Modal } from "./parts/modal";
import { MethodTab, MethodTabItem, methodTabButtonClassName } from "./parts/methodTab";
import { NexusBlock, PreferredNexusBlock, SearchedNexusBlock } from "./parts/nexusBlock";
import { NexusCandidateList } from "./nexusPicker";
import { ChordTones } from "./parts/chordTones";
import { findMatchingNexus } from "../basics/knownNexus";
import { ChordEditTrigger, ChordEditContext } from "./progressionEditor";

// タブ切替のためだけの内部区分。確定コールバックが分かれているため、モーダルの外にはこの区分自体が出てこない。
type Method = "formerNexus" | "latterNexus" | "direct";

function defaultMethod(trigger: ChordEditTrigger): Method {
	if (trigger === "changeChord" || trigger === "add") {
		return "direct";
	}
	return trigger === "insertBefore" ? "latterNexus" : "formerNexus";
}

// このモーダルのタイトル。挿入操作か既存コードの編集かで表示を分ける
function modalTitle(trigger: ChordEditTrigger): string {
	return trigger === "changeChord" ? "Select Chord" : "Insert Chord";
}

// 確定ボタンのラベル。挿入操作ではInsert/Add、既存コードの編集ではOKにする
function confirmButtonLabel(trigger: ChordEditTrigger): string {
	switch (trigger) {
		case "changeChord": return "OK";
		case "add": return "Add";
		case "insertBefore":
		case "insertAfter": return "Insert";
	}
}

function directButtonClassName(active: boolean): string {
	return active ? "basic-chord-modal__direct-button basic-chord-modal__direct-button--active" : "basic-chord-modal__direct-button";
}

// 現在モーダル内で選択されている内容。どの方式で選ばれたかと、それによって決まるchordを一体で持つ
type Selection =
	| { readonly method: "direct"; readonly chord: BasicChord }
	| { readonly method: "formerNexus"; readonly nexus: DegreeNexus; readonly chord: BasicChord }
	| { readonly method: "latterNexus"; readonly nexus: DegreeNexus; readonly chord: BasicChord };

type BasicChordModalProps = {
	readonly context: ChordEditContext;
	// nullの場合は「まだ何も選択していない」状態でモーダルを開く(挿入操作向け)
	readonly initialChord: BasicChord | null;
	readonly onConfirmDirect: (chord: BasicChord) => void;
	readonly onConfirmFormerNexus: (nexus: DegreeNexus) => void;
	readonly onConfirmLatterNexus: (nexus: DegreeNexus) => void;
	readonly onCancel: () => void;
};

export function BasicChordModal(props: BasicChordModalProps) {
	const { context, initialChord, onConfirmDirect, onConfirmFormerNexus, onConfirmLatterNexus, onCancel } = props;
	const [method, setMethod] = useState<Method>(() => defaultMethod(context.trigger));
	const [selection, setSelection] = useState<Selection | null>(() => initialChord ? { method: "direct", chord: initialChord } : null);

	const previousChord = context.formerChord?.chord ?? null;
	const nextChord = context.latterChord?.chord ?? null;
	const chord = selection?.chord ?? null;

	// 各候補リストの強調表示は、現在の選択が実際にそのnexusから導かれたものであればそれを、
	// そうでなければ既にそのgapに指定されているpreferredNexusを優先して使う
	const selectedFormerNexus = selection?.method === "formerNexus" ? selection.nexus : context.formerPreferredNexus ?? null;
	const selectedLatterNexus = selection?.method === "latterNexus" ? selection.nexus : context.latterPreferredNexus ?? null;

	const selectFromFormer = (nexus: DegreeNexus): void => {
		if (!previousChord) return;
		setSelection({ method: "formerNexus", nexus, chord: nexus.resolveFromFormerChord(previousChord).latterChord });
	};
	const selectFromLatter = (nexus: DegreeNexus): void => {
		if (!nextChord) return;
		setSelection({ method: "latterNexus", nexus, chord: nexus.resolveFromLatterChord(nextChord).formerChord });
	};
	const selectDirect = (candidate: BasicChord): void => {
		setSelection({ method: "direct", chord: candidate });
	};

	const handleConfirm = (): void => {
		if (!selection) return;
		if (selection.method === "direct") onConfirmDirect(selection.chord);
		if (selection.method === "formerNexus") onConfirmFormerNexus(selection.nexus);
		if (selection.method === "latterNexus") onConfirmLatterNexus(selection.nexus);
	};

	const tabs: readonly MethodTabItem<Method>[] = [
		{
			key: "formerNexus",
			disabled: !previousChord,
			button: previousChord && (selectedFormerNexus ? (
				<PreferredNexusBlock
					preferredNexus={selectedFormerNexus}
					formerChord={previousChord}
					latterChord={chord ?? undefined}
					formerStyle="muted"
					latterStyle="hidden"
				/>
			) : chord ? (
				<SearchedNexusBlock formerChord={previousChord} latterChord={chord} formerStyle="muted" latterStyle="hidden" />
			) : (
				<NexusBlock
					relative={undefined}
					degree={undefined}
					keyLabel={undefined}
					chords={{ formerChord: previousChord, formerStyle: "muted", latterChord: undefined, latterStyle: "hidden" }}
				/>
			)),
			content: previousChord && (
				<NexusCandidateList
					candidates={findMatchingNexus(previousChord, undefined)}
					anchorRole="former"
					selected={selectedFormerNexus}
					onSelect={selectFromFormer}
				/>
			),
		},
		{
			key: "direct",
			buttonClassName: active => `${methodTabButtonClassName(active)} method-tab-button--center`,
			button: chord ? (
				<>
					<span>{chord.toString()}</span>
					<ChordTones tones={chord.getChordTones()} />
				</>
			) : (
				<span className="basic-chord-modal__method-button-placeholder">Select chord</span>
			),
			content: (
				<div className="basic-chord-modal__direct-grid">
					{allBasicChords().map(candidate => (
						<button
							type="button"
							key={candidate.toString()}
							className={directButtonClassName(chord !== null && chord.equals(candidate))}
							onClick={() => selectDirect(candidate)}
						>
							<span>{candidate.toString()}</span>
							<ChordTones tones={candidate.getChordTones()} />
						</button>
					))}
				</div>
			),
		},
		{
			key: "latterNexus",
			disabled: !nextChord,
			button: nextChord && (selectedLatterNexus ? (
				<PreferredNexusBlock
					preferredNexus={selectedLatterNexus}
					formerChord={chord ?? undefined}
					latterChord={nextChord}
					formerStyle="hidden"
					latterStyle="muted"
				/>
			) : chord ? (
				<SearchedNexusBlock formerChord={chord} latterChord={nextChord} formerStyle="hidden" latterStyle="muted" />
			) : (
				<NexusBlock
					relative={undefined}
					degree={undefined}
					keyLabel={undefined}
					chords={{ formerChord: undefined, formerStyle: "hidden", latterChord: nextChord, latterStyle: "muted" }}
				/>
			)),
			content: nextChord && (
				<NexusCandidateList
					candidates={findMatchingNexus(undefined, nextChord)}
					anchorRole="latter"
					selected={selectedLatterNexus}
					onSelect={selectFromLatter}
				/>
			),
		},
	];

	return (
		<Modal
			className="basic-chord-modal method-tab-modal"
			title={modalTitle(context.trigger)}
			onCancel={onCancel}
			onConfirm={handleConfirm}
			confirmLabel={confirmButtonLabel(context.trigger)}
			confirmDisabled={selection === null}
		>
			<MethodTab tabs={tabs} active={method} onChange={setMethod} />
		</Modal>
	);
}
