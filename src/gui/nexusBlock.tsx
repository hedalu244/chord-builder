import { BasicChord } from "../basics/basicChord";
import { RelativeNexus, DegreeNexus, findMatchingNexus, calcRelativeNexus } from "../basics/nexus";
import { PitchClass } from "../basics/pitch";

type ChordsDisplay = {
	readonly formerChord: BasicChord | undefined;
	readonly latterChord: BasicChord | undefined;

	readonly emphasizeFormer: boolean;
	readonly emphasizeLatter: boolean;

	//readonly emphasizeSide: "former" | "latter";
};

// nexus-panel/basic-chord-modal で共通して表示される、nexusの説明テキスト
// NOTE: keyLabelという名前は、JSXのspread先で予約語のkeyと衝突するのを避けるため
type NexusBlockProps = {
	// 片側のコードしか定まっておらず相対関係すら計算できない場合はundefined(その行自体を表示しない)
	readonly relative: RelativeNexus | undefined;
	readonly degree: DegreeNexus | undefined;
	readonly keyLabel: PitchClass | undefined;
	readonly chords: ChordsDisplay | undefined;
};

function chordClassName(emphasized: boolean): string {
	return emphasized ? "nexus-block__chord" : "nexus-block__chord nexus-block__chord--muted";
}

export function SearchedNexusBlock(props: { formerChord: BasicChord; latterChord: BasicChord, showFormer: boolean, showLatter: boolean; pinnedNexus?: DegreeNexus; }) {
	const { formerChord, latterChord, showFormer, showLatter, pinnedNexus } = props;
	const relative = calcRelativeNexus(formerChord, latterChord);
	const chords = showFormer || showLatter ? {
		formerChord: showFormer ? formerChord : undefined,
		latterChord: showLatter ? latterChord : undefined,
		emphasizeFormer: false,
		emphasizeLatter: false,
	} : undefined;

	// ユーザーが明示指定したnexusがあれば、自動探索よりそちらを優先する
	if (pinnedNexus) {
		const keyLabel = pinnedNexus.resolveKeyFromFormer(formerChord);
		return (<NexusBlock relative={relative} degree={pinnedNexus} keyLabel={keyLabel} chords={chords} />);
	}

	const matches = findMatchingNexus(formerChord, latterChord);
	const primary = matches[0];

	if (primary) {
		return (<NexusBlock relative={relative} degree={primary.nexus} keyLabel={primary.key} chords={chords} />);
	}

	return (
		<NexusBlock relative={relative} degree={undefined} keyLabel={undefined} chords={chords} />
	);
}

export function DescribedNexusBlock(props: { anchorChord: BasicChord, anchorRole: "former" | "latter", nexus: DegreeNexus; }) {
	const { anchorChord, anchorRole, nexus } = props;
	const formerChord = anchorRole === "former" ? anchorChord : nexus.resolveFormerChord(anchorChord);
	const latterChord = anchorRole === "latter" ? anchorChord : nexus.resolveLatterChord(anchorChord);
	const keyLabel = anchorRole === "former" ? nexus.resolveKeyFromFormer(formerChord) : nexus.resolveKeyFromLatter(latterChord);
	const chords = {
		formerChord: formerChord,
		latterChord: latterChord,
		emphasizeFormer: anchorRole === "latter", // 逆側を強調する
		emphasizeLatter: anchorRole === "former" // 逆側を強調する
	};

	return (
		<NexusBlock
			relative={nexus.relativeNexus}
			degree={nexus}
			keyLabel={keyLabel}
			chords={chords}
		/>
	);
}

// nexusの相対/度数/キー説明を表示する。chordsを渡すと接続元→接続先のコード名も表示する。
export function NexusBlock(props: NexusBlockProps) {
	const { relative, degree, keyLabel, chords } = props;
	return (
		<>
			{chords && (
				<div className="nexus-block__chords">
					<span className={chordClassName(chords.emphasizeFormer)}>{chords.formerChord?.toString() ?? ""}</span>
					<span className="nexus-block__arrow">→</span>
					<span className={chordClassName(chords.emphasizeLatter)}>{chords.latterChord?.toString() ?? ""}</span>
				</div>
			)}

			<div className="nexus-block__relative">{relative ? relative.toString() : "-"}</div>
			<div className="nexus-block__degree">{degree ? degree.toString() : "unknown"}</div>
			<div className="nexus-block__key">{keyLabel ? `in key=${keyLabel.toString()}` : "-"}</div>
		</>
	);
}
