import { BasicChord } from "../basics/basicChord";

type BasicChordPanelProps = {
	readonly value: BasicChord;
	readonly onChangeChord: () => void;
};

export function BasicChordPanel(props: BasicChordPanelProps) {
	const { value, onChangeChord } = props;

	return (
		<div className="basic-chord-panel">
			<span className="basic-chord-panel__label">Basic Chord</span>
			<h4 className="basic-chord-panel__name">{value.toString()}</h4>
			<button type="button" className="basic-chord-panel__change-button" onClick={onChangeChord}>
				Change
			</button>
		</div>
	);
}
