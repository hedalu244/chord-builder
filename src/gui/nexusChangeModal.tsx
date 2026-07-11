import { useState } from "react";
import { BasicChord } from "../basics/basicChord";
import { DegreeNexus } from "../basics/nexus";
import { findMatchingNexus } from "../basics/knownNexus";
import { NexusEditMethod, NexusEditResult } from "../editor";
import { Modal } from "./modal";
import { MethodTab, MethodTabItem, methodTabButtonClassName } from "./methodTab";
import { PreferredNexusBlock, SearchedNexusBlock } from "./nexusBlock";
import { NexusCandidateList, NexusMatchList } from "./nexusPicker";

type NexusChangeModalProps = {
	readonly formerChord: BasicChord;
	readonly latterChord: BasicChord;
	readonly preferredNexus: DegreeNexus | undefined;
	readonly onConfirm: (result: NexusEditResult) => void;
	readonly onClear: () => void;
	readonly onCancel: () => void;
};

export function NexusChangeModal(props: NexusChangeModalProps) {
	const { formerChord, latterChord, preferredNexus, onConfirm, onClear, onCancel } = props;
	const [method, setMethod] = useState<NexusEditMethod>("fixed");
	const [selectedNexus, setSelectedNexus] = useState<DegreeNexus | null>(() => preferredNexus ?? null);

	const handleSetMethod = (nextMethod: NexusEditMethod): void => {
		if (nextMethod === method) return;
		setMethod(nextMethod);
		setSelectedNexus(current => {
			if (!current) return null;
			return findMatchingNexus(
				nextMethod === "formerChord" ? undefined : formerChord,
				nextMethod === "latterChord" ? undefined : latterChord
				).some(knownNexusInfo => knownNexusInfo.keyNexus.degreeNexus.equals(current)) ? current : null;
		});
	};

	// fixedモードの初期状態(preferredNexus由来)はまだ上記の検証を経ていないため、描画時にも同様の検証を行う
	const selected = method === "fixed"
		? (selectedNexus && findMatchingNexus(formerChord, latterChord).some(knownNexusInfo => knownNexusInfo.keyNexus.degreeNexus.equals(selectedNexus)) ? selectedNexus : null)
		: selectedNexus;

	const displayedFormerChord = method === "formerChord" && selected ? selected.resolveFromLatterChord(latterChord).formerChord : formerChord;
	const displayedLatterChord = method === "latterChord" && selected ? selected.resolveFromFormerChord(formerChord).latterChord : latterChord;

	// fixedモードでselectedがnull(=auto)のままOKを押した場合は優先指定の解除とみなす
	const handleConfirm = (): void => {
		if (selected) {
			onConfirm({ method, nexus: selected });
		} else if (method === "fixed") {
			onClear();
		}
	};

	const tabs: readonly MethodTabItem<NexusEditMethod>[] = [
		// 左のタブ=左のコードが変わる方式(formerChord: 右を固定して左を求める)
		{
			key: "formerChord",
			button: <span className="nexus-change-modal__method-button-chord">{displayedFormerChord.toString()}</span>,
			content: (
				<NexusCandidateList
					candidates={findMatchingNexus(undefined, latterChord)} // 変更しない方を固定
					anchorRole="latter"
					selected={selected}
					onSelect={setSelectedNexus}
				/>
			),
		},
		{
			key: "fixed",
			buttonClassName: active => `${methodTabButtonClassName(active)} method-tab-button--center`,
			button: selected
				? (
					<PreferredNexusBlock
						preferredNexus={selected}
						formerChord={displayedFormerChord}
						latterChord={displayedLatterChord}
						formerStyle="hidden"
						latterStyle="hidden"
					/>
				)
				: (
					<SearchedNexusBlock
						formerChord={displayedFormerChord}
						latterChord={displayedLatterChord}
						formerStyle="hidden"
						latterStyle="hidden"
					/>
				),
			content: (
				<NexusMatchList
					formerChord={formerChord}
					latterChord={latterChord}
					selected={selected}
					onSelect={setSelectedNexus}
				/>
			),
		},
		// 右のタブ=右のコードが変わる方式(latterChord: 左を固定して右を求める)
		{
			key: "latterChord",
			button: <span className="nexus-change-modal__method-button-chord">{displayedLatterChord.toString()}</span>,
			content: (
				<NexusCandidateList
					candidates={findMatchingNexus(formerChord, undefined)} // 変更しない方を固定
					anchorRole="former"
					selected={selected}
					onSelect={setSelectedNexus}
				/>
			),
		},
	];

	return (
		<Modal
			className="nexus-change-modal method-tab-modal"
			title="Select Nexus"
			onCancel={onCancel}
			onConfirm={handleConfirm}
			confirmDisabled={selected === null && method !== "fixed"}
		>
			<MethodTab tabs={tabs} active={method} onChange={handleSetMethod} />
		</Modal>
	);
}
