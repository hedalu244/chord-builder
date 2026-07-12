import { Triad } from "../../basics/triad";
import { ChordTones } from "../parts/chordTones";
import { IconButton } from "../parts/iconButton";

type ChordPanelProps = {
	readonly value: Triad;
	readonly onChangeChord: () => void;
};

export function ChordPanel(props: ChordPanelProps) {
	const { value, onChangeChord } = props;

	return (
		<div className="chord-panel">
			<span className="chord-panel__label">Triad</span>
			<h4 className="chord-panel__name">{value.toString()}</h4>
			<ChordTones tones={value.getChordTones()} />
			<IconButton icon="icons/edit.svg" label="Change" onClick={onChangeChord} />
		</div>
	);
}
