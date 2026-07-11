import { useState } from "react";
import { BasicChord } from "../basics/basicChord";
import { DegreeNexus, findMatchingNexus, findNexiByFormerMode, findNexiByLatterMode } from "../basics/nexus";
import { NexusEditMethod, NexusEditResult } from "../editor";
import { SearchedNexusBlock } from "./nexusBlock";
import { NexusCandidateList, NexusMatchList } from "./nexusPicker";

function methodButtonClassName(active: boolean): string {
	return active ? "nexus-change-modal__method-button nexus-change-modal__method-button--active" : "nexus-change-modal__method-button";
}

// 各モードで実際に選択可能なnexusの一覧。モード切替時に選択を維持できるかの判定にも使う
function candidatesForMethod(method: NexusEditMethod, formerChord: BasicChord, latterChord: BasicChord): readonly DegreeNexus[] {
	switch (method) {
		case "formerChord": return findNexiByLatterMode(latterChord.mode);
		case "latterChord": return findNexiByFormerMode(formerChord.mode);
		case "fixed": return findMatchingNexus(formerChord, latterChord).map(match => match.nexus);
	}
}

type NexusChangeModalProps = {
	readonly formerChord: BasicChord;
	readonly latterChord: BasicChord;
	readonly pinnedNexus: DegreeNexus | undefined;
	readonly onConfirm: (result: NexusEditResult) => void;
	readonly onClear: () => void;
	readonly onCancel: () => void;
};

export function NexusChangeModal(props: NexusChangeModalProps) {
	const { formerChord, latterChord, pinnedNexus, onConfirm, onClear, onCancel } = props;
	const [method, setMethod] = useState<NexusEditMethod>("fixed");
	const [selectedNexus, setSelectedNexus] = useState<DegreeNexus | null>(() => pinnedNexus ?? null);

	const handleSetMethod = (nextMethod: NexusEditMethod): void => {
		if (nextMethod === method) return;
		setMethod(nextMethod);
		// 選択中のnexusが切替先モードの候補にも存在すれば維持し、存在しなければ未選択にフォールする
		setSelectedNexus(current => {
			if (!current) return null;
			return candidatesForMethod(nextMethod, formerChord, latterChord).includes(current) ? current : null;
		});
	};

	// fixedモードの初期状態(pinnedNexus由来)はまだ上記の検証を経ていないため、描画時にも同様の検証を行う
	const selected = method === "fixed"
		? (selectedNexus && candidatesForMethod("fixed", formerChord, latterChord).includes(selectedNexus) ? selectedNexus : null)
		: selectedNexus;

	const displayedFormerChord = method === "formerChord" && selected ? selected.resolveFormerChord(latterChord) : formerChord;
	const displayedLatterChord = method === "latterChord" && selected ? selected.resolveLatterChord(formerChord) : latterChord;

	const handleClear = (): void => {
		setSelectedNexus(null);
		onClear();
	};

	return (
		<div className="modal__backdrop">
			<div className="modal nexus-change-modal">
				<div className="modal__title">Select Nexus</div>
				<div className="nexus-change-modal__method-row">
					{/* 左のボタン=左のコードが変わる方式(formerChord: 右を固定して左を求める) */}
					<button type="button" className={methodButtonClassName(method === "formerChord")} onClick={() => handleSetMethod("formerChord")}>
						<span className="nexus-change-modal__method-button-chord">{displayedFormerChord.toString()}</span>
					</button>

					<button type="button" className={`${methodButtonClassName(method === "fixed")} nexus-change-modal__method-button--center`} onClick={() => handleSetMethod("fixed")}>
						<SearchedNexusBlock
							formerChord={displayedFormerChord}
							latterChord={displayedLatterChord}
							showFormer={false}
							showLatter={false}
							pinnedNexus={selected ?? undefined}
						/>
					</button>

					{/* 右のボタン=右のコードが変わる方式(latterChord: 左を固定して右を求める) */}
					<button type="button" className={methodButtonClassName(method === "latterChord")} onClick={() => handleSetMethod("latterChord")}>
						<span className="nexus-change-modal__method-button-chord">{displayedLatterChord.toString()}</span>
					</button>
				</div>

				<div className="nexus-change-modal__content">
					{method === "formerChord" && (
						<NexusCandidateList
							candidates={findNexiByLatterMode(latterChord.mode)}
							anchorChord={latterChord}
							anchorRole="latter"
							selected={selected}
							onSelect={setSelectedNexus}
						/>
					)}
					{method === "fixed" && (
						<NexusMatchList
							formerChord={formerChord}
							latterChord={latterChord}
							selected={selected}
							onSelect={setSelectedNexus}
						/>
					)}
					{method === "latterChord" && (
						<NexusCandidateList
							candidates={findNexiByFormerMode(formerChord.mode)}
							anchorChord={formerChord}
							anchorRole="former"
							selected={selected}
							onSelect={setSelectedNexus}
						/>
					)}
				</div>

				<div className="modal__actions">
					<button type="button" className="modal__clear-button" disabled={pinnedNexus === undefined} onClick={handleClear}>Clear</button>
					<button type="button" className="modal__cancel-button" onClick={onCancel}>Cancel</button>
					<button
						type="button"
						className="modal__confirm-button"
						disabled={selected === null}
						onClick={() => selected && onConfirm({ method, nexus: selected })}
					>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}
