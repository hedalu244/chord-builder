import { ChangeEvent } from "react";
import { ChordQualityId, chordQualities } from "../basics/chordQuality";
import { PitchClass } from "../basics/pitch";
import { FullChordInfo } from "../basics/fullChordInfo";
import { BasicChord } from "../basics/basicChord";

const pitchClassOptions = Array.from({ length: 12 }, (_, index) => {
	const pitchClass = new PitchClass(index);
	return {
		value: index,
		label: pitchClass.toString()
	};
});

type ChordPanelProps = {
	readonly value: FullChordInfo;
	readonly onChange: (nextValue: FullChordInfo) => void;
};

export function ChordPanel(props: ChordPanelProps) {
	const { value, onChange } = props;
	const chordLabel = value.chord.toString();

	const handleRootChange = (event: ChangeEvent<HTMLSelectElement>): void => {
		onChange(new FullChordInfo(
			new BasicChord(
				new PitchClass(Number(event.target.value)),
				value.chord.qualityId
			)
		));
	};

	const handleQualityChange = (event: ChangeEvent<HTMLSelectElement>): void => {
		const nextQualityId = event.target.value as ChordQualityId;

		onChange(new FullChordInfo(
			new BasicChord(
				value.chord.root,
				nextQualityId
			)
		));
	};

	return (
		<div className="chord-panel">
			<div className="chord-panel__section">
				<h4 className="chord-panel__section-title">{chordLabel}</h4>
				<div className="chord-panel__field-row">
					<label className="chord-panel__field chord-panel__field--half">
						<span className="chord-panel__field-label">root</span>
						<select className="chord-panel__control" value={String(value.chord.root.value)} onChange={handleRootChange}>
							{pitchClassOptions.map(option => (
								<option key={option.value} value={String(option.value)}>
									{option.label}
								</option>
							))}
						</select>
					</label>
					<label className="chord-panel__field chord-panel__field--half">
						<span className="chord-panel__field-label">quality</span>
						<select className="chord-panel__control" value={value.chord.qualityId} onChange={handleQualityChange}>
							{chordQualities.map(quality => (
								<option key={quality.id} value={quality.id}>
									{quality.notation}
								</option>
							))}
						</select>
					</label>
				</div>
			</div>
		</div>
	);
}