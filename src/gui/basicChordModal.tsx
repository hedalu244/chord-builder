import { useState } from "react";
import { BasicChord, Mode } from "../basics/basicChord";
import { DegreeNexus, findNexiByFormerMode, findNexiByLatterMode } from "../basics/nexus";
import { PitchClass } from "../basics/pitch";
import { ChordEditContext, ChordEditMethod, defaultChordEditMethod } from "../editor";
import { SearchedNexusBlock, DescribedNexusBlock } from "./nexusBlock";

const pitchClassOptions = Array.from({ length: 12 }, (_, index) => {
	const pitchClass = new PitchClass(index);
	return {
		value: index,
		label: pitchClass.toString()
	};
});

function methodButtonClassName(active: boolean): string {
	return active ? "basic-chord-modal__method-button basic-chord-modal__method-button--active" : "basic-chord-modal__method-button";
}

function disabledMethodButtonClassName(): string {
	return "basic-chord-modal__method-button basic-chord-modal__method-button--disabled";
}

function nexusButtonClassName(active: boolean): string {
	return active ? "basic-chord-modal__nexus-button basic-chord-modal__nexus-button--active" : "basic-chord-modal__nexus-button";
}

type NexusCandidateListProps = {
	readonly candidates: readonly DegreeNexus[];
	readonly anchorChord: BasicChord;
	readonly anchorRole: "former" | "latter";
	readonly selected: DegreeNexus | null;
	readonly onSelect: (nexus: DegreeNexus) => void;
};

// ボタンごとに固有のnexusが分かっているので、探索ではなく直接、former/latter/relative/degree/keyを求める。
function NexusCandidateList(props: NexusCandidateListProps) {
	const { candidates, anchorChord, anchorRole, selected, onSelect } = props;
	return (
		<div className="basic-chord-modal__nexus-list">
			{candidates.map((nexus, index) => {
				return (
					<button type="button" key={index} className={nexusButtonClassName(nexus === selected)} onClick={() => onSelect(nexus)}>
						<DescribedNexusBlock anchorChord={anchorChord} anchorRole={anchorRole} nexus={nexus} />
					</button>
				);
			})}
		</div>
	);
}

type BasicChordModalProps = {
	readonly context: ChordEditContext;
	readonly initialChord: BasicChord;
	readonly onConfirm: (chord: BasicChord) => void;
	readonly onCancel: () => void;
};

export function BasicChordModal(props: BasicChordModalProps) {
	const { context, initialChord, onConfirm, onCancel } = props;
	const [method, setMethod] = useState<ChordEditMethod>(() => defaultChordEditMethod(context.trigger));
	const [chord, setChord] = useState<BasicChord>(initialChord);
	const [selectedFormerNexus, setSelectedFormerNexus] = useState<DegreeNexus | null>(null);
	const [selectedLatterNexus, setSelectedLatterNexus] = useState<DegreeNexus | null>(null);

	const previousChord = context.previousChord?.chord ?? null;
	const nextChord = context.nextChord?.chord ?? null;

	const selectFromFormer = (nexus: DegreeNexus): void => {
		if (!previousChord) return;
		setChord(nexus.resolveLatterChord(previousChord));
		setSelectedFormerNexus(nexus);
	};
	const selectFromLatter = (nexus: DegreeNexus): void => {
		if (!nextChord) return;
		setChord(nexus.resolveFormerChord(nextChord));
		setSelectedLatterNexus(nexus);
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
						{chord.toString()}
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
						<div className="basic-chord-modal__field-row">
							<select
								className="basic-chord-modal__control"
								value={String(chord.root.value)}
								onChange={event => setChord(new BasicChord(new PitchClass(Number(event.target.value)), chord.mode))}
							>
								{pitchClassOptions.map(option => (
									<option key={option.value} value={String(option.value)}>{option.label}</option>
								))}
							</select>
							<select
								className="basic-chord-modal__control"
								value={chord.mode}
								onChange={event => setChord(new BasicChord(chord.root, event.target.value as Mode))}
							>
								<option value="M">major</option>
								<option value="m">minor</option>
							</select>
						</div>
					)}
				</div>

				<div className="modal__actions">
					<button type="button" className="modal__cancel-button" onClick={onCancel}>Cancel</button>
					<button type="button" className="modal__confirm-button" onClick={() => onConfirm(chord)}>OK</button>
				</div>
			</div>
		</div >
	);
}
