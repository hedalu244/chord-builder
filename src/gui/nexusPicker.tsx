import { BasicChord } from "../basics/basicChord";
import { findMatchingNexus, KnownNexusInfo } from "../basics/knownNexus";
import { DegreeNexus } from "../basics/nexus";
import { KeyNexusBlock } from "./parts/nexusBlock";

function nexusButtonClassName(active: boolean): string {
	return active ? "nexus-picker__nexus-button nexus-picker__nexus-button--active" : "nexus-picker__nexus-button";
}

function nexusAutoButtonClassName(active: boolean): string {
	return active ? "nexus-picker__auto-button nexus-picker__auto-button--active" : "nexus-picker__auto-button";
}

type NexusCandidateListProps = {
	readonly candidates: readonly KnownNexusInfo[];
	// candidatesの中でformer/latterのどちらが固定側(anchor)かを表す。強調表示(変化する側)の判定にのみ使う
	readonly anchorRole: "former" | "latter";
	readonly selected: DegreeNexus | null;
	readonly onSelect: (degreeNexus: DegreeNexus) => void;
};

export function NexusCandidateList(props: NexusCandidateListProps) {
	const { candidates, anchorRole, selected, onSelect } = props;
	return (
		<div className="nexus-picker__nexus-list">
			{candidates.map((knownNexusInfo, index) => {
				const keyNexus = knownNexusInfo.keyNexus;
				return (
				<button
					type="button"
					key={index}
					className={nexusButtonClassName(selected !== null && keyNexus.degreeNexus.equals(selected))}
					onClick={() => onSelect(keyNexus.degreeNexus)}
				>
					<KeyNexusBlock
						keyNexus={keyNexus}
						formerStyle={anchorRole === "latter" ? "emphasized" : "muted"} // 逆側(変化する側)を強調する
						latterStyle={anchorRole === "former" ? "emphasized" : "muted"}
					/>
				</button>
				);
			})}
		</div>
	);
}

type NexusMatchListProps = {
	readonly formerChord: BasicChord;
	readonly latterChord: BasicChord;
	readonly selected: DegreeNexus | null;
	// nullは「auto」(固定しない)を意味する
	readonly onSelect: (degreeNexus: DegreeNexus | null) => void;
};

// 前後のコードを固定したまま、現時点で解釈可能なKnownNexiの候補を一覧表示する。
// 末尾には固定を解除する「auto」ボタンを常に添える。
export function NexusMatchList(props: NexusMatchListProps) {
	const { formerChord, latterChord, selected, onSelect } = props;
	const matches = findMatchingNexus(formerChord, latterChord);
	return (
		<div className="nexus-picker__nexus-list">
			{matches.map((knownNexusInfo, index) => {
				const keyNexus = knownNexusInfo.keyNexus;
				return (
				<button
					type="button"
					key={index}
					className={nexusButtonClassName(selected !== null && keyNexus.degreeNexus.equals(selected))}
					onClick={() => onSelect(keyNexus.degreeNexus)}
				>
					<KeyNexusBlock keyNexus={keyNexus} formerStyle="hidden" latterStyle="hidden" />
				</button>
				);
			})}
			<button
				type="button"
				className={nexusAutoButtonClassName(selected === null)}
				onClick={() => onSelect(null)}
			>
				Auto
			</button>
		</div>
	);
}

