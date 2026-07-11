import { useState } from "react";
import { findChordQuality } from "../basics/chordQuality";
import { FullChordInfo } from "../basics/fullChordInfo";
import { ChordTones } from "./chordTones";
import { IconButton } from "./iconButton";
import { QualityModal } from "./qualityModal";

type QualityPanelProps = {
	readonly value: FullChordInfo;
	readonly onChange: (nextValue: FullChordInfo) => void;
};

export function QualityPanel(props: QualityPanelProps) {
	const { value, onChange } = props;
	const [isEditing, setIsEditing] = useState(false);
	const tones = value.qualityId === undefined
		? value.chord.getChordTones()
		: findChordQuality(value.qualityId).getChordTones(value.chord.root);

	return (
		<div className="quality-panel">
			<span className="quality-panel__label">Quality</span>
			<h4 className="quality-panel__section-title">{value.toString()}</h4>
			<ChordTones tones={tones} />
			<IconButton icon="icons/edit.svg" label="Edit quality" className="quality-panel__edit-button" onClick={() => setIsEditing(true)} />
			{isEditing && (
				<QualityModal
					value={value}
					onConfirm={qualityId => {
						onChange(value.withQuality(qualityId));
						setIsEditing(false);
					}}
					onCancel={() => setIsEditing(false)}
				/>
			)}
		</div>
	);
}
