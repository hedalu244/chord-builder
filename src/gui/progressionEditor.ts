import { PitchClass } from "../basics/pitch";
import { chordVariants } from "../basics/variantChord";
import { createChordPanel, FullChordInfo } from "./chordPanel";

export type ProgressionEditorController = {
	element: HTMLElement;
	getValue: () => readonly FullChordInfo[];
	setValue: (nextValue: readonly FullChordInfo[]) => void;
};

export type InsertTrigger = "add" | "insertBefore" | "insertAfter";

export type InsertContext = {
	readonly previousChord: FullChordInfo | null;
	readonly nextChord: FullChordInfo | null;
	readonly trigger: InsertTrigger;
};

function copyChordInfo(chordInfo: FullChordInfo): FullChordInfo {
	return {
		chord: {
			root: new PitchClass(chordInfo.chord.root.value),
			quality: chordInfo.chord.quality
		},
		variant: chordInfo.variant
	};
}

function copyProgression(progression: readonly FullChordInfo[]): FullChordInfo[] {
	return progression.map(copyChordInfo);
}

function createInsertedChordInfo(_context: InsertContext): FullChordInfo {
	const defaultVariant = chordVariants.find(variant => variant.baseQuality === "major");
	if (defaultVariant === undefined) {
		throw new Error("missing default major variant");
	}

	return {
		chord: {
			root: new PitchClass(0),
			quality: "major"
		},
		variant: defaultVariant
	};
}

function createActionButton(label: string): HTMLButtonElement {
	const button = document.createElement("button");
	button.type = "button";
	button.textContent = label;
	button.className = "progression-editor__action-button";
	return button;
}

export function createProgressionEditor(
	initialProgression: readonly FullChordInfo[],
	onChange?: (nextProgression: readonly FullChordInfo[]) => void
): ProgressionEditorController {
	let progression = copyProgression(initialProgression);
	const animationDurationMs = 500;

	const root = document.createElement("div");
	root.className = "progression-editor";

	const scrollArea = document.createElement("div");
	scrollArea.className = "progression-editor__scroll-area";

	const row = document.createElement("div");
	row.className = "progression-editor__row";

	scrollArea.appendChild(row);
	root.appendChild(scrollArea);

	const getRowGapPx = (): number => {
		const computedStyle = window.getComputedStyle(row);
		const gapText = computedStyle.columnGap || computedStyle.gap;
		const parsed = Number.parseFloat(gapText);
		return Number.isNaN(parsed) ? 0 : parsed;
	};

	const getPanelItems = (): HTMLDivElement[] => {
		return Array.from(row.children).filter(
			child => child instanceof HTMLDivElement && child.classList.contains("progression-editor__chord-item")
		) as HTMLDivElement[];
	};

	const getAddItem = (): HTMLDivElement | undefined => {
		const addItem = Array.from(row.children).find(
			child => child instanceof HTMLDivElement && child.classList.contains("progression-editor__add-item")
		);
		return addItem as HTMLDivElement | undefined;
	};

	const clearShiftAnimationClasses = (item: HTMLDivElement): void => {
		item.classList.remove("progression-editor__item--delete-shift");
		item.classList.remove("progression-editor__item--delete-shift-active");
		item.classList.remove("progression-editor__item--insert-push");
		item.classList.remove("progression-editor__item--insert-push-active");
		item.style.removeProperty("--progression-shift");
	};

	const startDeleteShiftAnimation = (index: number, shiftPx: number): void => {
		if (shiftPx <= 0) {
			return;
		}

		const targetItem = getPanelItems()[index] ?? getAddItem();
		if (targetItem === undefined) {
			return;
		}

		clearShiftAnimationClasses(targetItem);
		targetItem.style.setProperty("--progression-shift", `${shiftPx}px`);
		targetItem.classList.add("progression-editor__item--delete-shift");

		requestAnimationFrame(() => {
			targetItem.classList.add("progression-editor__item--delete-shift-active");
		});

		window.setTimeout(() => {
			clearShiftAnimationClasses(targetItem);
		}, animationDurationMs);
	};

	const startInsertPushAnimation = (index: number): void => {
		const insertedItem = getPanelItems()[index];
		if (insertedItem === undefined) {
			return;
		}

		const shiftPx = insertedItem.offsetWidth + getRowGapPx();
		if (shiftPx <= 0) {
			return;
		}

		clearShiftAnimationClasses(insertedItem);
		insertedItem.style.setProperty("--progression-shift", `${shiftPx}px`);
		insertedItem.classList.add("progression-editor__item--insert-push");

		requestAnimationFrame(() => {
			insertedItem.classList.add("progression-editor__item--insert-push-active");
		});

		window.setTimeout(() => {
			clearShiftAnimationClasses(insertedItem);
		}, animationDurationMs);
	};

	const notifyChange = (): void => {
		onChange?.(copyProgression(progression));
	};

	const insertChordAt = (index: number, trigger: InsertTrigger): void => {
		if (index < 0 || index > progression.length) {
			throw new Error(`insert index out of range: ${index}`);
		}

		const previousChord = index === 0 ? null : progression[index - 1];
		const nextChord = index === progression.length ? null : progression[index];
		const nextChordInfo = createInsertedChordInfo({
			previousChord,
			nextChord,
			trigger
		});

		progression.splice(index, 0, nextChordInfo);
		render();
		startInsertPushAnimation(index);
		notifyChange();
	};

	const removeChordAt = (index: number): void => {
		if (index < 0 || index >= progression.length) {
			throw new Error(`remove index out of range: ${index}`);
		}
		const removedItem = getPanelItems()[index];
		const deletedShiftPx = removedItem === undefined ? 0 : removedItem.offsetWidth + getRowGapPx();
		progression.splice(index, 1);
		render();
		startDeleteShiftAnimation(index, deletedShiftPx);
		notifyChange();
	};

	const render = (): void => {
		row.replaceChildren();

		for (const [index, chordInfo] of progression.entries()) {
			const panelController = createChordPanel(chordInfo, nextValue => {
				progression[index] = copyChordInfo(nextValue);
				notifyChange();
			});
			panelController.element.classList.add("progression-editor__panel");

			const item = document.createElement("div");
			item.className = "progression-editor__slot progression-editor__chord-item";

			const deleteButton = createActionButton("Delete");
			deleteButton.className = "progression-editor__delete-button";
			deleteButton.addEventListener("click", () => {
				removeChordAt(index);
			});

			const insertBeforeButton = createActionButton("Insert before");
			insertBeforeButton.className = "progression-editor__insert-before-button";
			insertBeforeButton.addEventListener("click", () => {
				insertChordAt(index, "insertBefore");
			});

			const insertAfterButton = createActionButton("Insert after");
			insertAfterButton.className = "progression-editor__insert-after-button";
			insertAfterButton.addEventListener("click", () => {
				insertChordAt(index + 1, "insertAfter");
			});

			const panelActions = document.createElement("div");
			panelActions.className = "progression-editor__panel-actions";
			panelActions.appendChild(insertBeforeButton);
			panelActions.appendChild(insertAfterButton);
			panelActions.appendChild(deleteButton);

			panelController.element.appendChild(panelActions);
			item.appendChild(panelController.element);
			row.appendChild(item);
		}

		const addButton = createActionButton("Add chord");
		addButton.className = "progression-editor__action-button progression-editor__add-button";
		addButton.addEventListener("click", () => {
			insertChordAt(progression.length, "add");
		});

		const addPanel = document.createElement("div");
		addPanel.className = "chord-panel progression-editor__panel progression-editor__add-panel";
		addPanel.appendChild(addButton);

		const addItem = document.createElement("div");
		addItem.className = "progression-editor__slot progression-editor__add-item";
		addItem.appendChild(addPanel);
		row.appendChild(addItem);
	};

	render();

	return {
		element: root,
		getValue: () => copyProgression(progression),
		setValue: (nextValue: readonly FullChordInfo[]) => {
			progression = copyProgression(nextValue);
			render();
			notifyChange();
		}
	};
}
