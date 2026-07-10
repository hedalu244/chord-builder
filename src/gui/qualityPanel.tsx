import { ChangeEvent } from "react";
import { ChordQualityId, findQualitiesByMode } from "../basics/chordQuality";
import { FullChordInfo } from "../basics/fullChordInfo";

type QualityPanelProps = {
	readonly value: FullChordInfo;
	readonly onChange: (nextValue: FullChordInfo) => void;
};

export function QualityPanel(props: QualityPanelProps) {
	const { value, onChange } = props;
	const qualities = findQualitiesByMode(value.chord.mode);

	const handleQualityChange = (event: ChangeEvent<HTMLSelectElement>): void => {
		const nextQualityId = event.target.value === "" ? undefined : event.target.value as ChordQualityId;
		onChange(new FullChordInfo(value.chord, nextQualityId));
	};

	return (
		<div className="quality-panel">
			<span className="quality-panel__label">Quality</span>
			<h4 className="quality-panel__section-title">{value.toString()}</h4>
			<select className="quality-panel__control" value={value.qualityId ?? ""} onChange={handleQualityChange}>
				<option value="">-</option>
				{qualities.map(quality => (
					<option key={quality.id} value={quality.id}>
						{quality.notation}
					</option>
				))}
			</select>
		</div>
	);
}
