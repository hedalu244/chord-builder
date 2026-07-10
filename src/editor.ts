import { FullChordInfo } from "./basics/fullChordInfo";

export type InsertTrigger = "add" | "insertBefore" | "insertAfter";
export type InsertMethod = "formerNexus" | "latterNexus" | "direct";

export type InsertContext = {
	readonly previousChord: FullChordInfo | null;
	readonly nextChord: FullChordInfo | null;
	readonly trigger: InsertTrigger;
};

export type ProgressionItem = {
	readonly id: number;
	readonly chordInfo: FullChordInfo;
};

export function defaultInsertMethod(trigger: InsertTrigger): InsertMethod {
	return trigger === "insertBefore" ? "latterNexus" : "formerNexus";
}

export function toChordInfos(items: readonly ProgressionItem[]): FullChordInfo[] {
	return items.map(item => item.chordInfo);
}

export function replaceChordAtIndex(
	progression: readonly ProgressionItem[],
	index: number,
	nextChordInfo: FullChordInfo
): ProgressionItem[] {
	if (index < 0 || index >= progression.length) {
		throw new Error(`replace index out of range: ${index}`);
	}

	return progression.map((item, currentIndex) => {
		if (currentIndex !== index) {
			return item;
		}
		return {
			id: item.id,
			chordInfo: nextChordInfo
		};
	});
}

export function getInsertContext(
	progression: readonly ProgressionItem[],
	index: number,
	trigger: InsertTrigger
): InsertContext {
	if (index < 0 || index > progression.length) {
		throw new Error(`insert index out of range: ${index}`);
	}

	return {
		previousChord: index === 0 ? null : progression[index - 1].chordInfo,
		nextChord: index === progression.length ? null : progression[index].chordInfo,
		trigger
	};
}

export function insertChordInfoAtIndex(
	progression: readonly ProgressionItem[],
	index: number,
	chordInfo: FullChordInfo,
	createId: () => number
): ProgressionItem[] {
	if (index < 0 || index > progression.length) {
		throw new Error(`insert index out of range: ${index}`);
	}

	const insertedItem: ProgressionItem = {
		id: createId(),
		chordInfo
	};

	return [
		...progression.slice(0, index),
		insertedItem,
		...progression.slice(index)
	];
}

export function removeChordAtIndex(progression: readonly ProgressionItem[], index: number): ProgressionItem[] {
	if (index < 0 || index >= progression.length) {
		throw new Error(`remove index out of range: ${index}`);
	}

	return [...progression.slice(0, index), ...progression.slice(index + 1)];
}

export function createProgressionItems(
	value: readonly FullChordInfo[],
	createId: () => number
): ProgressionItem[] {
	return value.map(chordInfo => ({
		id: createId(),
		chordInfo
	}));
}

export function syncProgressionItems(
	current: readonly ProgressionItem[],
	value: readonly FullChordInfo[],
	createId: () => number
): readonly ProgressionItem[] {
	const nextValues = value;
	if (
		nextValues.length === current.length &&
		nextValues.every((nextChord, index) => nextChord.equals(current[index].chordInfo))
	) {
		return current;
	}

	return nextValues.map((chordInfo, index) => ({
		id: current[index]?.id ?? createId(),
		chordInfo
	}));
}