import { PitchClass } from "../basics/pitch";

type ChordTonesProps = {
	readonly tones: readonly PitchClass[];
};

export function ChordTones(props: ChordTonesProps) {
	const { tones } = props;
	return (
		<div className="chord-tones">
			{tones.map((tone, index) => (
				<span key={index} className="chord-tones__tone">{tone.toString()}</span>
			))}
		</div>
	);
}
