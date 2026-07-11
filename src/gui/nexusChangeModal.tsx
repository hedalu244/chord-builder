import { useState } from "react";
import { BasicChord } from "../basics/basicChord";
import { DegreeNexus, findNexiByFormerMode, findNexiByLatterMode } from "../basics/nexus";
import { NexusEditMethod, NexusEditResult } from "../editor";
import { SearchedNexusBlock } from "./nexusBlock";
import { NexusCandidateList, NexusMatchList } from "./nexusPicker";

function methodButtonClassName(active: boolean): string {
	return active ? "nexus-change-modal__method-button nexus-change-modal__method-button--active" : "nexus-change-modal__method-button";
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
	const [selectedFormerNexus, setSelectedFormerNexus] = useState<DegreeNexus | null>(null);
	// ユーザー指定(pinnedNexus)がある場合のみハイライトする。未指定のデフォルト状態では何も選択されていない見た目にする
	const [selectedFixedNexus, setSelectedFixedNexus] = useState<DegreeNexus | null>(() => pinnedNexus ?? null);
	const [selectedLatterNexus, setSelectedLatterNexus] = useState<DegreeNexus | null>(null);

	const selected = method === "formerNexus" ? selectedFormerNexus
		: method === "latterNexus" ? selectedLatterNexus
			: selectedFixedNexus;

	const handleClear = (): void => {
		setSelectedFormerNexus(null);
		setSelectedFixedNexus(null);
		setSelectedLatterNexus(null);
		onClear();
	};

	return (
		<div className="modal__backdrop">
			<div className="modal nexus-change-modal">
				<div className="nexus-change-modal__method-row">
					{/* 左のボタン=左のコードが変わる方式(latterNexus: 右を固定して左を求める) */}
					<button type="button" className={methodButtonClassName(method === "latterNexus")} onClick={() => setMethod("latterNexus")}>
						<span className="nexus-change-modal__method-button-chord">{formerChord.toString()}</span>
					</button>

					<button type="button" className={`${methodButtonClassName(method === "fixed")} nexus-change-modal__method-button--center`} onClick={() => setMethod("fixed")}>
						<SearchedNexusBlock formerChord={formerChord} latterChord={latterChord} showFormer={false} showLatter={false} pinnedNexus={pinnedNexus} />
					</button>

					{/* 右のボタン=右のコードが変わる方式(formerNexus: 左を固定して右を求める) */}
					<button type="button" className={methodButtonClassName(method === "formerNexus")} onClick={() => setMethod("formerNexus")}>
						<span className="nexus-change-modal__method-button-chord">{latterChord.toString()}</span>
					</button>
				</div>

				<div className="nexus-change-modal__content">
					{method === "formerNexus" && (
						<NexusCandidateList
							candidates={findNexiByFormerMode(formerChord.mode)}
							anchorChord={formerChord}
							anchorRole="former"
							selected={selectedFormerNexus}
							onSelect={setSelectedFormerNexus}
						/>
					)}
					{method === "fixed" && (
						<NexusMatchList
							formerChord={formerChord}
							latterChord={latterChord}
							selected={selectedFixedNexus}
							onSelect={setSelectedFixedNexus}
						/>
					)}
					{method === "latterNexus" && (
						<NexusCandidateList
							candidates={findNexiByLatterMode(latterChord.mode)}
							anchorChord={latterChord}
							anchorRole="latter"
							selected={selectedLatterNexus}
							onSelect={setSelectedLatterNexus}
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
