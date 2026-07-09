import { ChangeEvent, useMemo } from "react";
import { BasicChordQuality } from "../basics/basicChord";
import { PitchClass } from "../basics/pitch";
import {
	checkCompatibility,
	chordVariants
} from "../basics/chordVariant";
import { FullChordInfo } from "../basics/fullChordInfo";

const chordQualities: readonly BasicChordQuality[] = ["major", "minor"];

const pitchClassOptions = Array.from({ length: 12 }, (_, index) => {
	const pitchClass = new PitchClass(index);
	return {
		value: index,
		label: pitchClass.toString()
	};
});

type VariantOption = {
	variantIndex: number;
	label: string;
};

type ChordPanelProps = {
	readonly value: FullChordInfo;
	readonly onChange: (nextValue: FullChordInfo) => void;
};

function getVariantOptions(quality: BasicChordQuality): VariantOption[] {
	return chordVariants[quality].map((variant, index) => ({
		variantIndex: index,
		label: variant.name
	}));
}

export function ChordPanel(props: ChordPanelProps) {
	const { value, onChange } = props;

	const normalizedValue = useMemo(() => {
		const compatibleVariant = checkCompatibility(value.variant, value.chord.quality);
		if (compatibleVariant === value.variant) {
			return value;
		}
		return {
			chord: value.chord,
			variant: compatibleVariant
		};
	}, [value]);

	const variantOptions = useMemo(
		() => getVariantOptions(normalizedValue.chord.quality),
		[normalizedValue.chord.quality]
	);

	const selectedVariantIndex = chordVariants[normalizedValue.chord.quality].findIndex(variant => variant === normalizedValue.variant);

	const handleRootChange = (event: ChangeEvent<HTMLSelectElement>): void => {
		onChange({
			chord: {
				root: new PitchClass(Number(event.target.value)),
				quality: normalizedValue.chord.quality
			},
			variant: normalizedValue.variant
		});
	};

	const handleQualityChange = (event: ChangeEvent<HTMLSelectElement>): void => {
		const nextQuality = event.target.value as BasicChordQuality;
		const compatibleVariant = checkCompatibility(normalizedValue.variant, nextQuality);

		onChange({
			chord: {
				root: normalizedValue.chord.root,
				quality: nextQuality
			},
			variant: compatibleVariant
		});
	};

	const handleVariantChange = (event: ChangeEvent<HTMLSelectElement>): void => {
		const selectedIndex = Number(event.target.value);
		const selectedVariant = chordVariants[normalizedValue.chord.quality][selectedIndex];

		onChange({
			chord: normalizedValue.chord,
			variant: selectedVariant
		});
	};

	return (
		<div className="chord-panel">
			<div className="chord-panel__section">
				<h4 className="chord-panel__section-title">BasicChord</h4>
				<label className="chord-panel__field">
					<span className="chord-panel__field-label">root</span>
					<select className="chord-panel__control" value={String(normalizedValue.chord.root.value)} onChange={handleRootChange}>
						{pitchClassOptions.map(option => (
							<option key={option.value} value={String(option.value)}>
								{option.label}
							</option>
						))}
					</select>
				</label>
				<label className="chord-panel__field">
					<span className="chord-panel__field-label">quality</span>
					<select className="chord-panel__control" value={normalizedValue.chord.quality} onChange={handleQualityChange}>
						{chordQualities.map(quality => (
							<option key={quality} value={quality}>
								{quality}
							</option>
						))}
					</select>
				</label>
			</div>
			<div className="chord-panel__section">
				<h4 className="chord-panel__section-title">ChordVariant</h4>
				<label className="chord-panel__field">
					<span className="chord-panel__field-label">variant</span>
					<select className="chord-panel__control" value={String(selectedVariantIndex)} onChange={handleVariantChange}>
						{variantOptions.map(option => (
							<option key={option.variantIndex} value={String(option.variantIndex)}>
								{option.label}
							</option>
						))}
					</select>
				</label>
			</div>
		</div>
	);
}