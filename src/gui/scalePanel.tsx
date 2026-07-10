import { useState } from "react";
import { FullChordInfo } from "../basics/fullChordInfo";
import { ChordScaleModal } from "./chordScaleModal";
import { ChordTones } from "./chordTones";
import { IconButton } from "./iconButton";
import { ScaleAnalysis } from "./scaleAnalysis";

type ScalePanelProps = {
	readonly value: FullChordInfo;
	readonly onChange: (nextValue: FullChordInfo) => void;
};

export function ScalePanel(props: ScalePanelProps) {
	const { value, onChange } = props;
	const [isEditing, setIsEditing] = useState(false);
	const root = value.getChordRoot();
	const scale = value.getScale();

	return (
		<div className="scale-panel">
			<span className="scale-panel__label">Scale</span>
			<ScaleAnalysis chordInfo={value} root={root} scale={scale} />
			<ChordTones tones={scale.getPitchClasses(root)} />
			<IconButton icon="icons/edit.svg" label="Edit scale" className="scale-panel__edit-button" onClick={() => setIsEditing(true)} />
			{isEditing && (
				<ChordScaleModal
					chordInfo={value}
					onConfirm={extraScaleTones => {
						onChange(value.withExtraScaleTones(extraScaleTones));
						setIsEditing(false);
					}}
					onCancel={() => setIsEditing(false)}
				/>
			)}
		</div>
	);
}
