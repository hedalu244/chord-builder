import { useState } from "react";
import { FullChordInfo } from "../basics/fullChordInfo";
import { getScale } from "../basics/scale";
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
	const scale = getScale(value);

	return (
		<div className="scale-panel">
			<span className="scale-panel__label">Scale</span>
			<ScaleAnalysis chordInfo={value} scale={scale} />
			<ChordTones tones={scale.getPitchClasses()} />
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
