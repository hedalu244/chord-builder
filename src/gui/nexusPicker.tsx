import { BasicChord } from "../basics/basicChord";
import { DegreeNexus, findMatchingNexus } from "../basics/nexus";
import { DescribedNexusBlock, NexusBlock } from "./nexusBlock";

function nexusButtonClassName(active: boolean): string {
	return active ? "nexus-picker__nexus-button nexus-picker__nexus-button--active" : "nexus-picker__nexus-button";
}

type NexusCandidateListProps = {
	readonly candidates: readonly DegreeNexus[];
	readonly anchorChord: BasicChord;
	readonly anchorRole: "former" | "latter";
	readonly selected: DegreeNexus | null;
	readonly onSelect: (nexus: DegreeNexus) => void;
};

// ボタンごとに固有のnexusが分かっているので、探索ではなく直接、former/latter/relative/degree/keyを求める。
export function NexusCandidateList(props: NexusCandidateListProps) {
	const { candidates, anchorChord, anchorRole, selected, onSelect } = props;
	return (
		<div className="nexus-picker__nexus-list">
			{candidates.map((nexus, index) => {
				return (
					<button type="button" key={index} className={nexusButtonClassName(nexus === selected)} onClick={() => onSelect(nexus)}>
						<DescribedNexusBlock anchorChord={anchorChord} anchorRole={anchorRole} nexus={nexus} />
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
	readonly onSelect: (nexus: DegreeNexus) => void;
};

// 前後のコードを固定したまま、現時点で解釈可能なKnownNexiの候補を一覧表示する。
export function NexusMatchList(props: NexusMatchListProps) {
	const { formerChord, latterChord, selected, onSelect } = props;
	const matches = findMatchingNexus(formerChord, latterChord);
	return (
		<div className="nexus-picker__nexus-list">
			{matches.map(({ nexus, key }, index) => (
				<button type="button" key={index} className={nexusButtonClassName(nexus === selected)} onClick={() => onSelect(nexus)}>
					<NexusBlock relative={nexus.relativeNexus} degree={nexus} keyLabel={key} chords={undefined} />
				</button>
			))}
		</div>
	);
}
