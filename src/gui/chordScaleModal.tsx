import { useState } from "react";
import { FullChordInfo } from "../basics/fullChordInfo";
import { Interval, PitchClass } from "../basics/pitch";
import { Scale } from "../basics/scale";
import { ScaleAnalysis } from "./scaleAnalysis";
import { KnownScaleInfo, findCandidateScales } from "../basics/knownScale";
import { EditableToneRow, ToneRow } from "./toneRow";

type CandidateListProps = {
	readonly root: PitchClass;
	readonly candidates: readonly KnownScaleInfo[];
	readonly currentScale: Scale;
	readonly onSelect: (scale: Scale) => void;
};

function CandidateList(props: CandidateListProps) {
	const { root, candidates, currentScale, onSelect } = props;
	const rootName = root.toString();
	if (candidates.length === 0) {
		return (
			<div className="chord-scale-modal__candidate-list">
				<div className="chord-scale-modal__candidate-placeholder">No matching known scales</div>
			</div>
		);
	}

	return (
		<div className="chord-scale-modal__candidate-list">
			{candidates.map((info, index) => {
				const classNames = ["chord-scale-modal__candidate-button"];
				if (info.scale.equals(currentScale)) classNames.push("chord-scale-modal__candidate-button--exact");
				return (
					<button type="button" key={index} className={classNames.join(" ")} onClick={() => onSelect(info.scale)}>
						<div className="chord-scale-modal__candidate-header">
							<span className="chord-scale-modal__candidate-name">{rootName} {info.name}</span>
							<span className="chord-scale-modal__candidate-origin">{root.sub(info.parentRootOffset).toString()} {info.description}</span>
						</div>
						<ToneRow root={root} tones={info.scale.getPitchClasses(root)} />
					</button>
				);
			})}
		</div>
	);
}

type ChordScaleModalProps = {
	readonly chordInfo: FullChordInfo;
	readonly onConfirm: (extraScaleTones: readonly Interval[] | undefined) => void;
	readonly onCancel: () => void;
};

export function ChordScaleModal(props: ChordScaleModalProps) {
	const { chordInfo, onConfirm, onCancel } = props;
	const root = chordInfo.getChordRoot();
	const chordToneIntervals = chordInfo.getChordToneIntervals();
	const lockedValues = new Set<number>(chordToneIntervals.map(tone => tone.value));

	const [checkedValues, setCheckedValues] = useState<ReadonlySet<number>>(
		() => new Set(chordInfo.getScale().tones.map(tone => tone.value))
	);

	const currentScale = new Scale(Interval.map(Array.from(checkedValues)));
	const candidates = findCandidateScales(currentScale);

	const handleSelectCandidate = (scale: Scale): void => {
		setCheckedValues(new Set(scale.tones.map(tone => tone.value)));
	};

	const handleConfirm = (): void => {
		const extraScaleTones = Array.from(checkedValues)
			.filter(value => !lockedValues.has(value))
			.map(value => new Interval(value));
		onConfirm(extraScaleTones.length === 0 ? undefined : extraScaleTones);
	};

	return (
		<div className="modal__backdrop">
			<div className="modal chord-scale-modal">
				<ScaleAnalysis chordInfo={chordInfo} root={root} scale={currentScale} />
				<EditableToneRow root={root} activeValues={checkedValues} lockedValues={lockedValues} onChange={setCheckedValues} />
				<CandidateList root={root} candidates={candidates} currentScale={currentScale} onSelect={handleSelectCandidate} />
				<div className="modal__actions">
					<button type="button" className="modal__cancel-button" onClick={onCancel}>Cancel</button>
					<button type="button" className="modal__confirm-button" onClick={handleConfirm}>OK</button>
				</div>
			</div>
		</div>
	);
}
