import { BasicChord, BasicChordQuality } from "../basics/basicChord";
import { ChordVariant, chordVariants } from "../basics/variantChord";
import { PitchClass } from "../basics/pitch";

const chordQualities: BasicChordQuality[] = ["major", "minor"];

const pitchClassOptions = Array.from({ length: 12 }, (_, index) => {
	const pitchClass = new PitchClass(index);
	return {
		value: index,
		label: pitchClass.toString()
	};
});

export type FullChordInfo = {
	readonly chord: BasicChord;
	readonly variant: ChordVariant;
};

export type ChordPanelController = {
	element: HTMLElement;
	getValue: () => FullChordInfo;
	setValue: (nextValue: FullChordInfo) => void;
};

function createSectionTitle(text: string): HTMLHeadingElement {
	const heading = document.createElement("h4");
	heading.textContent = text;
	heading.className = "chord-panel__section-title";
	return heading;
}

function createFieldContainer(): HTMLLabelElement {
	const field = document.createElement("label");
	field.className = "chord-panel__field";
	return field;
}

function createTextLabel(text: string): HTMLSpanElement {
	const label = document.createElement("span");
	label.textContent = text;
	label.className = "chord-panel__field-label";
	return label;
}

function createSelectField<T extends string | number>(
	labelText: string,
	options: { value: T; label: string }[]
): { container: HTMLLabelElement; select: HTMLSelectElement } {
	const container = createFieldContainer();
	container.appendChild(createTextLabel(labelText));

	const select = document.createElement("select");
	select.className = "chord-panel__control";

	for (const optionData of options) {
		const option = document.createElement("option");
		option.value = String(optionData.value);
		option.textContent = optionData.label;
		select.appendChild(option);
	}

	container.appendChild(select);
	return { container, select };
}

function isSameVariant(left: ChordVariant, right: ChordVariant): boolean {
	if (left.name !== right.name) {
		return false;
	}
	if (left.baseQuality !== right.baseQuality) {
		return false;
	}
	if (left.intervals.length !== right.intervals.length) {
		return false;
	}

	for (const [index, interval] of left.intervals.entries()) {
		if (interval.value !== right.intervals[index].value) {
			return false;
		}
	}

	return true;
}

function findVariantIndex(variant: ChordVariant): number {
	const index = chordVariants.findIndex(candidate => isSameVariant(candidate, variant));
	if (index < 0) {
		throw new Error(`unknown chord variant: ${variant.name}`);
	}
	return index;
}

type VariantOption = {
	variantIndex: number;
	label: string;
};

function getVariantOptions(quality: BasicChordQuality): VariantOption[] {
	const options: VariantOption[] = [];

	for (const [variantIndex, variant] of chordVariants.entries()) {
		if (variant.baseQuality !== quality) {
			continue;
		}
		options.push({
			variantIndex,
			label: variant.name
		});
	}

	return options;
}

export function createChordPanel(
	initialValue: FullChordInfo,
	onChange?: (nextValue: FullChordInfo) => void
): ChordPanelController {
	let currentValue = initialValue;

	const panel = document.createElement("div");
	panel.className = "chord-panel";

	const basicSection = document.createElement("div");
	basicSection.className = "chord-panel__section";
	basicSection.appendChild(createSectionTitle("BasicChord"));

	const rootField = createSelectField("root", pitchClassOptions);
	const qualityField = createSelectField("quality", chordQualities.map(quality => ({ value: quality, label: quality })));

	basicSection.appendChild(rootField.container);
	basicSection.appendChild(qualityField.container);

	const variantSection = document.createElement("div");
	variantSection.className = "chord-panel__section";
	variantSection.appendChild(createSectionTitle("ChordVariant"));

	const variantField = createSelectField("variant", []);

	variantSection.appendChild(variantField.container);

	panel.appendChild(basicSection);
	panel.appendChild(variantSection);

	const notifyChange = (): void => {
		onChange?.(currentValue);
	};

	const syncVariantOptionsFromQuality = (): void => {
		const options = getVariantOptions(currentValue.chord.quality);
		if (options.length === 0) {
			throw new Error(`no chord variants for quality: ${currentValue.chord.quality}`);
		}

		const currentVariantIndex = findVariantIndex(currentValue.variant);
		const hasCurrentVariant = options.some(option => option.variantIndex === currentVariantIndex);

		if (!hasCurrentVariant) {
			const fallbackVariant = chordVariants[options[0].variantIndex];
			if (fallbackVariant === undefined) {
				throw new Error(`variant index out of range: ${options[0].variantIndex}`);
			}
			currentValue = {
				...currentValue,
				variant: fallbackVariant
			};
		}

		variantField.select.replaceChildren();
		for (const optionData of options) {
			const option = document.createElement("option");
			option.value = String(optionData.variantIndex);
			option.textContent = optionData.label;
			variantField.select.appendChild(option);
		}
	};

	const syncInputsFromValue = (): void => {
		syncVariantOptionsFromQuality();
		rootField.select.value = String(currentValue.chord.root.value);
		qualityField.select.value = currentValue.chord.quality;
		variantField.select.value = String(findVariantIndex(currentValue.variant));
	};

	rootField.select.addEventListener("change", () => {
		currentValue = {
			...currentValue,
			chord: {
				...currentValue.chord,
				root: new PitchClass(Number(rootField.select.value))
			}
		};
		notifyChange();
	});

	qualityField.select.addEventListener("change", () => {
		const nextQuality = qualityField.select.value as BasicChordQuality;
		currentValue = {
			...currentValue,
			chord: {
				...currentValue.chord,
				quality: nextQuality
			}
		};
		syncVariantOptionsFromQuality();
		variantField.select.value = String(findVariantIndex(currentValue.variant));
		notifyChange();
	});

	variantField.select.addEventListener("change", () => {
		const selectedIndex = Number(variantField.select.value);
		const selectedVariant = chordVariants[selectedIndex];
		if (selectedVariant === undefined) {
			throw new Error(`variant index out of range: ${selectedIndex}`);
		}

		currentValue = {
			...currentValue,
			variant: selectedVariant
		};
		notifyChange();
	});

	syncInputsFromValue();

	return {
		element: panel,
		getValue: () => currentValue,
		setValue: (nextValue: FullChordInfo) => {
			currentValue = nextValue;
			syncInputsFromValue();
			notifyChange();
		}
	};
}
