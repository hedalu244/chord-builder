import { useState } from "react";
import { ChordEntry } from "../../editor/chordEntry";
import { Interval } from "../../basics/pitch";
import { ChordScaleModal } from "../chordScaleModal";
import { ChordTones } from "../parts/chordTones";
import { IconButton } from "../parts/iconButton";
import { ScaleAnalysis } from "../parts/scaleAnalysis";

type ChordScalePanelProps = {
	readonly entry: ChordEntry;
	readonly onChange: (nextExtraChordScaleTones: readonly Interval[] | undefined) => void;
};

export function ChordScalePanel(props: ChordScalePanelProps) {
	const { entry, onChange } = props;
	const { chord } = entry;
	const [isEditing, setIsEditing] = useState(false);
	const root = chord.triad.root;
	const scale = entry.getChordScale();

	return (
		<div className="chord-scale-panel">
			<span className="chord-scale-panel__label">Scale</span>
			<ScaleAnalysis chord={chord} root={root} scale={scale} />
			<ChordTones tones={scale.getPitchClasses(root)} />
			<IconButton icon="icons/edit.svg" label="Edit scale" onClick={() => setIsEditing(true)} />
			{isEditing && (
				<ChordScaleModal
					entry={entry}
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
