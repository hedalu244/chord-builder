import { useState } from "react";
import { ChordEntry } from "../basics/chordEntry";
import { Interval, PitchClass } from "../basics/pitch";
import { Scale } from "../basics/scale";
import { ScaleAnalysis } from "./parts/scaleAnalysis";
import { KnownScale, findCandidateScales, getKnownScaleInfo } from "../basics/knownScale";
import { Modal } from "./parts/modal";
import { EditableToneRow, ToneRow } from "./parts/toneRow";

type CandidateListProps = {
	readonly root: PitchClass;
	readonly candidates: readonly KnownScale[];
	readonly currentScale: Scale;
	readonly onSelect: (scale: Scale) => void;
};

function CandidateList(props: CandidateListProps) {
	const { root, candidates, currentScale, onSelect } = props;
	if (candidates.length === 0) {
		return (
			<div className="chord-scale-modal__candidate-list">
				<div className="chord-scale-modal__candidate-placeholder">No matching known scales</div>
			</div>
		);
	}

	return (
		<div className="chord-scale-modal__candidate-list">
			{candidates.map((knownScale, index) => {
				const selected = knownScale.scale.equals(currentScale);
				const description = getKnownScaleInfo(knownScale, root);

				return (
					<button
						type="button"
						key={index}
						className={selected ? "option-button option-button--selected" : "option-button"}
						onClick={() => onSelect(knownScale.scale)}
					>
						<div className="chord-scale-modal__candidate-header">
							<span className="scale-name">{description.name}</span>
							<span className="scale-origin">{description.description}</span>
						</div>
						<ToneRow root={root} tones={knownScale.scale.getPitchClasses(root)} />
					</button>
				);
			})}
		</div>
	);
}

type ChordScaleModalProps = {
	readonly entry: ChordEntry;
	readonly onConfirm: (nextExtraChordScaleTones: readonly Interval[] | undefined) => void;
	readonly onCancel: () => void;
};

export function ChordScaleModal(props: ChordScaleModalProps) {
	const { entry, onConfirm, onCancel } = props;
	const { chord } = entry;
	const root = chord.triad.root;
	const chordToneIntervals = chord.getChordToneIntervals();
	const lockedValues = new Set<number>(chordToneIntervals.map(tone => tone.value));

	const [checkedValues, setCheckedValues] = useState<ReadonlySet<number>>(
		() => new Set(entry.getChordScale().tones.map(tone => tone.value))
	);

	const currentScale = new Scale(Interval.map(Array.from(checkedValues)));
	const candidates = findCandidateScales(currentScale);

	const handleSelectCandidate = (scale: Scale): void => {
		setCheckedValues(new Set(scale.tones.map(tone => tone.value)));
	};

	const handleConfirm = (): void => {
		const nextExtraChordScaleTones = Array.from(checkedValues)
			.filter(value => !lockedValues.has(value))
			.map(value => new Interval(value));
		onConfirm(nextExtraChordScaleTones.length === 0 ? undefined : nextExtraChordScaleTones);
	};

	return (
		<Modal className="chord-scale-modal" title="Edit Chord Scale" onCancel={onCancel} onConfirm={handleConfirm}>
			<ScaleAnalysis chord={chord} root={root} scale={currentScale} />
			<EditableToneRow root={root} activeValues={checkedValues} lockedValues={lockedValues} onChange={setCheckedValues} />
			<CandidateList root={root} candidates={candidates} currentScale={currentScale} onSelect={handleSelectCandidate} />
		</Modal>
	);
}
