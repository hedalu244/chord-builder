import { useState } from "react";
import { allBasicChords, BasicChord } from "../basics/basicChord";
import { DegreeNexus } from "../basics/nexus";
import { ChordEditContext, ChordEditMethod, ChordEditResult, ChordEditTrigger, defaultChordEditMethod } from "../editor";
import { Modal } from "./modal";
import { MethodTab, MethodTabItem, methodTabButtonClassName } from "./methodTab";
import { NexusBlock, SearchedNexusBlock } from "./nexusBlock";
import { NexusCandidateList } from "./nexusPicker";
import { ChordTones } from "./chordTones";
import { findMatchingNexus } from "../basics/knownNexus";

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

type LastEdit = {
	readonly method: ChordEditMethod;
	readonly nexus: DegreeNexus | null;
};

type BasicChordModalProps = {
	readonly context: ChordEditContext;
	// nullの場合は「まだ何も選択していない」状態でモーダルを開く(挿入操作向け)
	readonly initialChord: BasicChord | null;
	readonly onConfirm: (result: ChordEditResult) => void;
	readonly onCancel: () => void;
};

export function BasicChordModal(props: BasicChordModalProps) {
	const { context, initialChord, onConfirm, onCancel } = props;
	const [method, setMethod] = useState<ChordEditMethod>(() => defaultChordEditMethod(context.trigger));
	const [chord, setChord] = useState<BasicChord | null>(initialChord);
	const [lastEdit, setLastEdit] = useState<LastEdit>({ method: "direct", nexus: null });

	const previousChord = context.formerChord?.chord ?? null;
	const nextChord = context.latterChord?.chord ?? null;

	// 各候補リストの強調表示は、現在のchordが実際にそのnexusから導かれたものかどうかで決める
	// (別タブで選び直した後も古い選択がハイライトされたままにならないよう、stateとしては持たずlastEditから導出する)
	const selectedFormerNexus = lastEdit.method === "formerNexus" ? lastEdit.nexus : null;
	const selectedLatterNexus = lastEdit.method === "latterNexus" ? lastEdit.nexus : null;

	const selectFromFormer = (nexus: DegreeNexus): void => {
		if (!previousChord) return;
		setChord(nexus.resolveFromFormerChord(previousChord).latterChord);
		setLastEdit({ method: "formerNexus", nexus });
	};
	const selectFromLatter = (nexus: DegreeNexus): void => {
		if (!nextChord) return;
		setChord(nexus.resolveFromLatterChord(nextChord).formerChord);
		setLastEdit({ method: "latterNexus", nexus });
	};
	const selectDirect = (candidate: BasicChord): void => {
		setChord(candidate);
		setLastEdit({ method: "direct", nexus: null });
	};

	const tabs: readonly MethodTabItem<ChordEditMethod>[] = [
		{
			key: "formerNexus",
			disabled: !previousChord,
			button: previousChord && (chord ? (
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
			button: nextChord && (chord ? (
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
			onConfirm={() => chord && onConfirm({ chord, method: lastEdit.method, nexus: lastEdit.nexus })}
			confirmLabel={confirmButtonLabel(context.trigger)}
			confirmDisabled={chord === null}
		>
			<MethodTab tabs={tabs} active={method} onChange={setMethod} />
		</Modal>
	);
}
