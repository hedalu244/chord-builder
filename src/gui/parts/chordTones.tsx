import { PitchClass } from "../../basics/pitch";

type ChordTonesProps = {
	readonly tones: readonly PitchClass[];
};

export function ChordTones(props: ChordTonesProps) {
	const { tones } = props;
	return (
		<div className="chord-tones">
			{tones.map((tone, index) => (
				<span
					key={index}
					className="chord-tones__tone"
					style={{
						background: `var(--pc-${tone.value}-light)`,
						borderColor: `var(--pc-${tone.value}-basic)`,
						color: `var(--pc-${tone.value}-dark)`,
					}}
				>
					{tone.toString()}
				</span>
			))}
		</div>
	);
}
