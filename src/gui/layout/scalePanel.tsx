import { useState } from "react";
import { Chord } from "../../basics/chord";
import { getChordScale } from "../../basics/chordScale";
import { Interval } from "../../basics/pitch";
import { ChordScaleModal } from "../chordScaleModal";
import { ChordTones } from "../parts/chordTones";
import { IconButton } from "../parts/iconButton";
import { ScaleAnalysis } from "../parts/scaleAnalysis";

type ScalePanelProps = {
	readonly chord: Chord;
	readonly extraChordScaleTones: readonly Interval[] | undefined;
	readonly onChange: (nextExtraChordScaleTones: readonly Interval[] | undefined) => void;
};

export function ScalePanel(props: ScalePanelProps) {
	const { chord, extraChordScaleTones, onChange } = props;
	const [isEditing, setIsEditing] = useState(false);
	const root = chord.triad.root;
	const scale = getChordScale(chord, extraChordScaleTones);

	return (
		<div className="scale-panel">
			<span className="scale-panel__label">Scale</span>
			<ScaleAnalysis chord={chord} root={root} scale={scale} />
			<ChordTones tones={scale.getPitchClasses(root)} />
			<IconButton icon="icons/edit.svg" label="Edit scale" onClick={() => setIsEditing(true)} />
			{isEditing && (
				<ChordScaleModal
					chord={chord}
					extraChordScaleTones={extraChordScaleTones}
					onConfirm={nextExtraChordScaleTones => {
						onChange(nextExtraChordScaleTones);
						setIsEditing(false);
					}}
					onCancel={() => setIsEditing(false)}
				/>
			)}
		</div>
	);
}
