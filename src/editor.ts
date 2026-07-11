import { BasicChord } from "./basics/basicChord";
import { FullChordInfo } from "./basics/fullChordInfo";
import { DegreeNexus } from "./basics/nexus";

export type InsertTrigger = "add" | "insertBefore" | "insertAfter";
export type ChordEditTrigger = InsertTrigger | "changeChord";
export type ChordEditMethod = "formerNexus" | "latterNexus" | "direct";
export type NexusEditMethod = "latterChord" | "formerChord" | "fixed";

export type ChordEditContext = {
	readonly formerChord: FullChordInfo | null;
	readonly latterChord: FullChordInfo | null;
	readonly trigger: ChordEditTrigger;
};

export type ChordEditResult = {
	readonly chord: BasicChord;
	readonly method: ChordEditMethod;
	// formerNexus/latterNexus で選んだ nexus。direct では null
	readonly nexus: DegreeNexus | null;
};

export type NexusEditResult = {
	readonly method: NexusEditMethod;
	readonly nexus: DegreeNexus;
};

export type ProgressionItem = {
	readonly id: number;
	readonly chordInfo: FullChordInfo;
};

// progression[i]とprogression[i+1]の間のnexusをユーザーが明示指定した場合の値。長さはprogression.length-1。
// undefinedは自動計算へのフォールバックを意味する。
export type PreferredNexi = readonly (DegreeNexus | undefined)[];

export function defaultChordEditMethod(trigger: ChordEditTrigger): ChordEditMethod {
	if (trigger === "changeChord") {
		return "direct";
	}
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

export function changeChordAtIndex(
	progression: readonly ProgressionItem[],
	index: number,
	chord: BasicChord
): ProgressionItem[] {
	const current = progression[index].chordInfo;
	// モードが変わらなければルートのみの変更としてクオリティ・スケールを維持し、モードが変わればクオリティ変更とみなしてスケールもデフォルトにリセットする
	const nextChordInfo = chord.mode === current.chord.mode
		? current.withChord(chord)
		: new FullChordInfo(chord, undefined);
	return replaceChordAtIndex(progression, index, nextChordInfo);
}

export function getInsertContext(
	progression: readonly ProgressionItem[],
	index: number,
	trigger: InsertTrigger
): ChordEditContext {
	if (index < 0 || index > progression.length) {
		throw new Error(`insert index out of range: ${index}`);
	}

	return {
		formerChord: index === 0 ? null : progression[index - 1].chordInfo,
		latterChord: index === progression.length ? null : progression[index].chordInfo,
		trigger
	};
}

export function getChangeContext(
	progression: readonly ProgressionItem[],
	index: number
): ChordEditContext {
	if (index < 0 || index >= progression.length) {
		throw new Error(`change index out of range: ${index}`);
	}

	return {
		formerChord: index === 0 ? null : progression[index - 1].chordInfo,
		latterChord: index === progression.length - 1 ? null : progression[index + 1].chordInfo,
		trigger: "changeChord"
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

export function setNexusSlot(
	preferred: PreferredNexi,
	index: number,
	nexus: DegreeNexus | undefined
): PreferredNexi {
	if (index < 0 || index >= preferred.length) {
		return preferred;
	}
	return preferred.map((current, currentIndex) => currentIndex === index ? nexus : current);
}

// insertChordInfoAtIndexと同じindexで呼ぶ。挿入によって生じる1〜2個の新しい隣接スロットはundefinedになる。
export function insertNexusSlot(preferred: PreferredNexi, index: number): PreferredNexi {
	const length = preferred.length + 1;
	return Array.from({ length }, (_, j) => {
		if (j < index - 1) return preferred[j];
		if (j === index - 1) return undefined;
		if (j === index) return undefined;
		return preferred[j - 1];
	});
}

// removeChordAtIndexと同じindexで呼ぶ。削除によって統合される隣接スロットはundefinedになる（端の削除はシフトのみ）。
export function removeNexusSlot(preferred: PreferredNexi, index: number): PreferredNexi {
	const length = preferred.length - 1;
	if (length <= 0) return [];
	return Array.from({ length }, (_, j) => {
		if (j < index - 1) return preferred[j];
		if (j === index - 1) return undefined;
		return preferred[j + 1];
	});
}

// indexは「今回変更/挿入されたコードの新しい位置」。formerNexus/latterNexusで選んだnexusをその隣接スロットに反映し、
// 逆側の隣接スロットは（コードが変わったことで既存の優先指定が無効になり得るため）undefinedに戻す。
export function applyChordEditToPreferredNexi(
	preferred: PreferredNexi,
	index: number,
	method: ChordEditMethod,
	nexus: DegreeNexus | null
): PreferredNexi {
	if (method === "formerNexus" && nexus) {
		return setNexusSlot(setNexusSlot(preferred, index - 1, nexus), index, undefined);
	}
	if (method === "latterNexus" && nexus) {
		return setNexusSlot(setNexusSlot(preferred, index, nexus), index - 1, undefined);
	}
	return setNexusSlot(setNexusSlot(preferred, index - 1, undefined), index, undefined);
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
