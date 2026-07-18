import { Chord } from "../../basics/chord";
import { ChordNotation } from "../parts/chordNotation";
import { ChordTones } from "../parts/chordTones";
import { IconButton } from "../parts/iconButton";

type ChordPanelProps = {
	readonly value: Chord;
	readonly onChangeChord: () => void;
};

export function ChordPanel(props: ChordPanelProps) {
	const { value, onChangeChord } = props;

	return (
		<div className="chord-panel">
			<span className="chord-panel__label">Chord</span>
			<h4><ChordNotation chord={value} /></h4>
			<ChordTones tones={value.chordTones} />
			<IconButton icon="icons/edit.svg" label="Change" onClick={onChangeChord} />
		</div>
	);
}
