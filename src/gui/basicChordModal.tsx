import { useState } from "react";
import { BasicChord, Mode } from "../basics/basicChord";
import { DegreeNexus, findNexiByFormerMode, findNexiByLatterMode } from "../basics/nexus";
import { PitchClass } from "../basics/pitch";
import { ChordEditContext, ChordEditMethod, defaultChordEditMethod } from "../editor";
import { formatKnownNexus } from "./nexusPanel";

const pitchClassOptions = Array.from({ length: 12 }, (_, index) => {
	const pitchClass = new PitchClass(index);
	return {
		value: index,
		label: pitchClass.toString()
	};
});

function flankClassName(active: boolean): string {
	return active ? "basic-chord-modal__flank basic-chord-modal__flank--active" : "basic-chord-modal__flank";
}

function nexusButtonClassName(active: boolean): string {
	return active ? "basic-chord-modal__nexus-button basic-chord-modal__nexus-button--active" : "basic-chord-modal__nexus-button";
}

function NexusDisplay(props: { readonly formerChord: BasicChord; readonly latterChord: BasicChord }) {
	const { relative, degree, key } = formatKnownNexus(props.formerChord, props.latterChord);
	return (
		<>
			<div className="basic-chord-modal__flank-relative">{relative}</div>
			<div className="basic-chord-modal__flank-degree">{degree}</div>
			<div className="basic-chord-modal__flank-key">{key}</div>
		</>
	);
}

type NexusCandidateListProps = {
	readonly candidates: readonly DegreeNexus[];
	readonly resolveKey: (nexus: DegreeNexus) => PitchClass;
	readonly selected: DegreeNexus | null;
	readonly onSelect: (nexus: DegreeNexus) => void;
};

function NexusCandidateList(props: NexusCandidateListProps) {
	const { candidates, resolveKey, selected, onSelect } = props;
	return (
		<div className="basic-chord-modal__nexus-list">
			{candidates.map((nexus, index) => (
				<button type="button" key={index} className={nexusButtonClassName(nexus === selected)} onClick={() => onSelect(nexus)}>
					<div className="basic-chord-modal__nexus-degree">{nexus.toString()}</div>
					<div className="basic-chord-modal__nexus-key">{`in key=${resolveKey(nexus).toString()}`}</div>
				</button>
			))}
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
	const [selectedNexusA, setSelectedNexusA] = useState<DegreeNexus | null>(null);
	const [selectedNexusB, setSelectedNexusB] = useState<DegreeNexus | null>(null);

	const previousChord = context.previousChord?.chord ?? null;
	const nextChord = context.nextChord?.chord ?? null;

	const selectFromFormer = (nexus: DegreeNexus): void => {
		if (!previousChord) return;
		setChord(new BasicChord(nexus.resolveLatterRoot(previousChord.root), nexus.relativeNexus.latterMode));
		setSelectedNexusA(nexus);
	};
	const selectFromLatter = (nexus: DegreeNexus): void => {
		if (!nextChord) return;
		setChord(new BasicChord(nexus.resolveFormerRoot(nextChord.root), nexus.relativeNexus.formerMode));
		setSelectedNexusB(nexus);
	};

	return (
		<div className="basic-chord-modal__backdrop">
			<div className="basic-chord-modal">
				<div className="basic-chord-modal__flank-row">
					{context.previousChord && <div className="basic-chord-modal__context-chord">{context.previousChord.toString()}</div>}
					<button type="button" className={flankClassName(method === "formerNexus")} onClick={() => setMethod("formerNexus")}>
						{previousChord
							? <NexusDisplay formerChord={previousChord} latterChord={chord} />
							: <span className="basic-chord-modal__flank-placeholder">–</span>}
					</button>
					<button type="button" className={`${flankClassName(method === "direct")} basic-chord-modal__flank--center`} onClick={() => setMethod("direct")}>
						{chord.toString()}
					</button>
					<button type="button" className={flankClassName(method === "latterNexus")} onClick={() => setMethod("latterNexus")}>
						{nextChord
							? <NexusDisplay formerChord={chord} latterChord={nextChord} />
							: <span className="basic-chord-modal__flank-placeholder">–</span>}
					</button>
					{context.nextChord && <div className="basic-chord-modal__context-chord">{context.nextChord.toString()}</div>}
				</div>

				{method === "formerNexus" && (
					previousChord ? (
						<NexusCandidateList
							candidates={findNexiByFormerMode(previousChord.mode)}
							resolveKey={nexus => nexus.resolveKeyFromFormerRoot(previousChord.root)}
							selected={selectedNexusA}
							onSelect={selectFromFormer}
						/>
					) : <p className="basic-chord-modal__hint">前のコードがありません</p>
				)}
				{method === "latterNexus" && (
					nextChord ? (
						<NexusCandidateList
							candidates={findNexiByLatterMode(nextChord.mode)}
							resolveKey={nexus => nexus.resolveKeyFromLatterRoot(nextChord.root)}
							selected={selectedNexusB}
							onSelect={selectFromLatter}
						/>
					) : <p className="basic-chord-modal__hint">次のコードがありません</p>
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

				<div className="basic-chord-modal__actions">
					<button type="button" className="basic-chord-modal__cancel-button" onClick={onCancel}>Cancel</button>
					<button type="button" className="basic-chord-modal__confirm-button" onClick={() => onConfirm(chord)}>OK</button>
				</div>
			</div>
		</div>
	);
}
