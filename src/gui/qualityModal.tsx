import { useState } from "react";
import { ChordQualityId, findChordQuality, findQualitiesByMode } from "../basics/chordQuality";
import { FullChordInfo } from "../basics/fullChordInfo";
import { Modal } from "./modal";
import { ToneRow } from "./toneRow";

function qualityButtonClassName(active: boolean): string {
	return active ? "quality-modal__quality-button quality-modal__quality-button--active" : "quality-modal__quality-button";
}

type QualityModalProps = {
	readonly value: FullChordInfo;
	readonly onConfirm: (qualityId: ChordQualityId | undefined) => void;
	readonly onCancel: () => void;
};

export function QualityModal(props: QualityModalProps) {
	const { value, onConfirm, onCancel } = props;
	const { chord } = value;
	const qualities = findQualitiesByMode(chord.mode);
	const [qualityId, setQualityId] = useState<ChordQualityId | undefined>(value.qualityId);
	const selectedNotation = qualityId === undefined ? chord.toString() : findChordQuality(qualityId).getNotation(chord);

	return (
		<Modal className="quality-modal" title="Select Quality" onCancel={onCancel} onConfirm={() => onConfirm(qualityId)}>
			<h4 className="quality-modal__header">{selectedNotation}</h4>
			<div className="quality-modal__list">
				<button type="button" className={qualityButtonClassName(qualityId === undefined)} onClick={() => setQualityId(undefined)}>
					<span>{chord.toString()}</span>
					<ToneRow root={chord.root} tones={chord.getChordTones()} />
				</button>
				{qualities.map(quality => (
					<button
						type="button"
						key={quality.id}
						className={qualityButtonClassName(qualityId === quality.id)}
						onClick={() => setQualityId(quality.id as ChordQualityId)}
					>
						<span>{quality.getNotation(chord)}</span>
						<ToneRow root={chord.root} tones={quality.getChordTones(chord.root)} />
					</button>
				))}
			</div>
		</Modal>
	);
}
