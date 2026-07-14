import { Chord } from "../../basics/chord";

type ChordNotationProps = {
	readonly chord: Chord;
};

export function ChordNotation(props: ChordNotationProps) {
	const { chord } = props;
	const parts = chord.getSyntheticNotationParts();
	return (
		<span className="chord-notation">
			{parts.base}
			{(parts.tension || parts.omit) && (
				<span className="chord-notation__annotations">
					{parts.tension && <sup>{parts.tension}</sup>}
					{parts.omit && <sub>{parts.omit}</sub>}
				</span>
			)}
		</span>
	);
}
