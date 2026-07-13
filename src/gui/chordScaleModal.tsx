import { useState } from "react";
import { ChordEntry } from "../editor/chordEntry";
import { Interval } from "../basics/pitch";
import { Scale } from "../basics/scale";
import { ScaleAnalysis } from "./parts/scaleAnalysis";
import { findSuperScaleInfos } from "../basics/scaleDictionary";
import { Modal } from "./parts/modal";
import { EditableToneRow, ToneRow } from "./parts/toneRow";
import { ScaleInfo } from "../basics/scaleInfo";

type CandidateListProps = {
	readonly candidates: readonly ScaleInfo[];
	readonly currentScale: Scale;
	readonly onSelect: (scale: Scale) => void;
};

function CandidateList(props: CandidateListProps) {
	const { candidates, currentScale, onSelect } = props;
	if (candidates.length === 0) {
		return (
			<div className="chord-scale-modal__candidate-list">
				<div className="chord-scale-modal__candidate-placeholder">No matching known scales</div>
			</div>
		);
	}

	return (
		<div className="chord-scale-modal__candidate-list">
			{candidates.map((candidate, index) => {
				const scale = candidate.getScale();
				const selected = scale.equals(currentScale);

				return (
					<button
						type="button"
						key={index}
						className={selected ? "option-button option-button--selected" : "option-button"}
						onClick={() => onSelect(scale)}
					>
						<div className="chord-scale-modal__candidate-header">
							<span className="scale-name">{candidate.label()}</span>
							<span className="scale-origin">{candidate.description()}</span>
						</div>
						<ToneRow root={candidate.root} tones={candidate.getPitchClasses()} />
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
	const candidates = findSuperScaleInfos(root, currentScale);

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
			<CandidateList candidates={candidates} currentScale={currentScale} onSelect={handleSelectCandidate} />
		</Modal>
	);
}
