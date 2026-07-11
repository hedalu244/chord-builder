import { useState } from "react";
import { allModes, BasicChord } from "../basics/basicChord";
import { DegreeNexus, findNexiByFormerMode, findNexiByLatterMode } from "../basics/nexus";
import { PitchClass } from "../basics/pitch";
import { ChordEditContext, ChordEditMethod, ChordEditResult, defaultChordEditMethod } from "../editor";
import { SearchedNexusBlock } from "./nexusBlock";
import { NexusCandidateList } from "./nexusPicker";
import { ChordTones } from "./chordTones";

function methodButtonClassName(active: boolean): string {
	return active ? "basic-chord-modal__method-button basic-chord-modal__method-button--active" : "basic-chord-modal__method-button";
}

function disabledMethodButtonClassName(): string {
	return "basic-chord-modal__method-button basic-chord-modal__method-button--disabled";
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
	readonly initialChord: BasicChord;
	readonly onConfirm: (result: ChordEditResult) => void;
	readonly onCancel: () => void;
};

export function BasicChordModal(props: BasicChordModalProps) {
	const { context, initialChord, onConfirm, onCancel } = props;
	const [method, setMethod] = useState<ChordEditMethod>(() => defaultChordEditMethod(context.trigger));
	const [chord, setChord] = useState<BasicChord>(initialChord);
	const [selectedFormerNexus, setSelectedFormerNexus] = useState<DegreeNexus | null>(null);
	const [selectedLatterNexus, setSelectedLatterNexus] = useState<DegreeNexus | null>(null);
	const [lastEdit, setLastEdit] = useState<LastEdit>({ method: "direct", nexus: null });

	const previousChord = context.previousChord?.chord ?? null;
	const nextChord = context.nextChord?.chord ?? null;

	const selectFromFormer = (nexus: DegreeNexus): void => {
		if (!previousChord) return;
		setChord(nexus.resolveLatterChord(previousChord));
		setSelectedFormerNexus(nexus);
		setLastEdit({ method: "formerNexus", nexus });
	};
	const selectFromLatter = (nexus: DegreeNexus): void => {
		if (!nextChord) return;
		setChord(nexus.resolveFormerChord(nextChord));
		setSelectedLatterNexus(nexus);
		setLastEdit({ method: "latterNexus", nexus });
	};
	const selectDirect = (candidate: BasicChord): void => {
		setChord(candidate);
		setLastEdit({ method: "direct", nexus: null });
	};

	return (
		<div className="modal__backdrop">
			<div className="modal basic-chord-modal">
				<div className="basic-chord-modal__method-row">
					{previousChord ? (
						<button type="button" className={methodButtonClassName(method === "formerNexus")} onClick={() => setMethod("formerNexus")}>
							<SearchedNexusBlock formerChord={previousChord} latterChord={chord} showFormer={true} showLatter={false} />
						</button>
					) : (
						<button type="button" className={disabledMethodButtonClassName()} disabled></button>
					)}

					<button type="button" className={`${methodButtonClassName(method === "direct")} basic-chord-modal__method-button--center`} onClick={() => setMethod("direct")}>
						<span>{chord.toString()}</span>
						<ChordTones tones={chord.getChordTones()} />
					</button>

					{nextChord ? (
						<button type="button" className={methodButtonClassName(method === "latterNexus")} onClick={() => setMethod("latterNexus")}>
							<SearchedNexusBlock formerChord={chord} latterChord={nextChord} showFormer={false} showLatter={true} />
						</button>
					) : (
						<button type="button" className={disabledMethodButtonClassName()} disabled></button>
					)}
				</div>

				<div className="basic-chord-modal__content">
					{method === "formerNexus" && (
						previousChord && (
							<NexusCandidateList
								candidates={findNexiByFormerMode(previousChord.mode)}
								anchorChord={previousChord}
								anchorRole="former"
								selected={selectedFormerNexus}
								onSelect={selectFromFormer}
							/>
						)
					)}
					{method === "latterNexus" && (
						nextChord && (
							<NexusCandidateList
								candidates={findNexiByLatterMode(nextChord.mode)}
								anchorChord={nextChord}
								anchorRole="latter"
								selected={selectedLatterNexus}
								onSelect={selectFromLatter}
							/>
						)
					)}
					{method === "direct" && (
						<div className="basic-chord-modal__direct-grid">
							{allModes.map(mode => (
								PitchClass.all.map(root => {
									const candidate = new BasicChord(root, mode);
									return (
										<button
											type="button"
											key={`${root.value}-${mode}`}
											className={directButtonClassName(chord.root.equals(root) && chord.mode === mode)}
											onClick={() => selectDirect(candidate)}
										>
											<span>{candidate.toString()}</span>
											<ChordTones tones={candidate.getChordTones()} />
										</button>
									);
								})
							))}
						</div>
					)}
				</div>

				<div className="modal__actions">
					<button type="button" className="modal__cancel-button" onClick={onCancel}>Cancel</button>
					<button type="button" className="modal__confirm-button" onClick={() => onConfirm({ chord, method: lastEdit.method, nexus: lastEdit.nexus })}>OK</button>
				</div>
			</div>
		</div >
	);
}
