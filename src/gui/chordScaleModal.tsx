import { useState } from "react";
import { FullChordInfo } from "../basics/fullChordInfo";
import { Interval, PitchClass } from "../basics/pitch";
import { Scale } from "../basics/scale";
import { ScaleAnalysis } from "./scaleAnalysis";
import { KnownScaleInfo, findCandidateScales } from "../basics/knownScale";

const ALL_VALUES = Array.from({ length: 12 }, (_, value) => value);

// 12音を半音順に並べた行。direct inputでは操作可能なチェックボックスとして、候補リストでは静的な表示として使う
type ToneRowProps = {
	readonly root: PitchClass;
	readonly activeValues: ReadonlySet<number>;
	readonly lockedValues?: ReadonlySet<number>;
	readonly onToggle?: (value: number) => void;
};

function ToneRow(props: ToneRowProps) {
	const { root, activeValues, lockedValues, onToggle } = props;
	return (
		<div className="chord-scale-modal__tone-row">
			{ALL_VALUES.map(value => {
				const locked = lockedValues?.has(value) ?? false;
				const active = activeValues.has(value);
				const classNames = ["chord-scale-modal__tone-cell"];
				if (locked) classNames.push("chord-scale-modal__tone-cell--locked");
				else if (active) classNames.push("chord-scale-modal__tone-cell--active");
				const label = root.add(new Interval(value)).toString();

				if (!onToggle) {
					return (
						<span key={value} className={classNames.join(" ")}>{active ? label : ""}</span>
					);
				}
				return (
					<label key={value} className={classNames.join(" ")}>
						<input type="checkbox" checked={active} disabled={locked} onChange={() => onToggle(value)} />
						<span>{label}</span>
					</label>
				);
			})}
		</div>
	);
}

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
				const activeValues = new Set(info.scale.tones.map(tone => tone.value));
				return (
					<button type="button" key={index} className={classNames.join(" ")} onClick={() => onSelect(info.scale)}>
						<div className="chord-scale-modal__candidate-header">
							<span className="chord-scale-modal__candidate-name">{rootName} {info.name}</span>
							<span className="chord-scale-modal__candidate-origin">{root.sub(info.parentRootOffset).toString()} {info.description}</span>
						</div>
						<ToneRow root={root} activeValues={activeValues} />
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

	const handleToggle = (value: number): void => {
		if (lockedValues.has(value)) return;
		setCheckedValues(previous => {
			const next = new Set(previous);
			if (next.has(value)) next.delete(value);
			else next.add(value);
			return next;
		});
	};

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
				<ToneRow root={root} activeValues={checkedValues} lockedValues={lockedValues} onToggle={handleToggle} />
				<CandidateList root={root} candidates={candidates} currentScale={currentScale} onSelect={handleSelectCandidate} />
				<div className="modal__actions">
					<button type="button" className="modal__cancel-button" onClick={onCancel}>Cancel</button>
					<button type="button" className="modal__confirm-button" onClick={handleConfirm}>OK</button>
				</div>
			</div>
		</div>
	);
}
