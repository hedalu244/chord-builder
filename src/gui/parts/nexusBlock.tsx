import { BasicChord } from "../../basics/basicChord";
import { RelativeNexus, DegreeNexus, calcRelativeNexus, KeyNexus } from "../../basics/nexus";
import { findMatchingNexus } from "../../basics/knownNexus";
import { PitchClass } from "../../basics/pitch";

export type DisplayStyle = "hidden" | "muted" | "emphasized";

type ChordsDisplay = {
	readonly formerChord: BasicChord | undefined;
	readonly formerStyle: DisplayStyle;
	readonly latterChord: BasicChord | undefined;
	readonly latterStyle: DisplayStyle;
};

function chordClassName(style: DisplayStyle): string {
	return style === "emphasized" ? "nexus-block__chord" : "nexus-block__chord nexus-block__chord--muted";
}

function chordText(chord: BasicChord | undefined, style: DisplayStyle): string {
	return style === "hidden" ? "" : (chord?.toString() ?? "");
}

type PreferredNexusBlockProps = {
	readonly preferredNexus: DegreeNexus;
	readonly formerChord?: BasicChord;
	readonly latterChord?: BasicChord;
	readonly formerStyle: DisplayStyle;
	readonly latterStyle: DisplayStyle;
};

export function PreferredNexusBlock(props: PreferredNexusBlockProps) {
	const { preferredNexus, formerChord, latterChord, formerStyle, latterStyle } = props;
	const keyLabel = formerChord
		? preferredNexus.resolveFromFormerChord(formerChord).key
		: (latterChord ? preferredNexus.resolveFromLatterChord(latterChord).key : undefined);

	return (
		<NexusBlock
			relative={preferredNexus.relativeNexus}
			degree={preferredNexus}
			keyLabel={keyLabel}
			chords={{ formerChord, formerStyle, latterChord, latterStyle }}
		/>
	);
}

type SearchedNexusBlockProps = {
	readonly formerChord: BasicChord;
	readonly latterChord: BasicChord;
	readonly formerStyle: DisplayStyle;
	readonly latterStyle: DisplayStyle;
};

export function SearchedNexusBlock(props: SearchedNexusBlockProps) {
	const { formerChord, latterChord, formerStyle, latterStyle } = props;
	const relative = calcRelativeNexus(formerChord, latterChord);
	const keyNexus = findMatchingNexus(formerChord, latterChord)[0]?.keyNexus;
	const degree = keyNexus?.degreeNexus;
	const keyLabel = keyNexus?.key;
	return (
		<NexusBlock
			relative={relative}
			degree={degree}
			keyLabel={keyLabel}
			chords={{ formerChord, formerStyle, latterChord, latterStyle }}
		/>
	);
}

type KeyNexusBlockProps = {
	readonly keyNexus: KeyNexus;
	readonly formerStyle: DisplayStyle;
	readonly latterStyle: DisplayStyle;
};

export function KeyNexusBlock(props: KeyNexusBlockProps) {
	const { keyNexus, formerStyle, latterStyle } = props;
	return (
		<NexusBlock
			relative={keyNexus.relativeNexus}
			degree={keyNexus.degreeNexus}
			keyLabel={keyNexus.key}
			chords={{
				formerChord: keyNexus.formerChord,
				formerStyle,
				latterChord: keyNexus.latterChord,
				latterStyle,
			}}
		/>
	);
}

// nexus-panel/basic-chord-modal/nexus-change-modal で共通して表示される、nexusの説明テキスト
// NOTE: keyLabelという名前は、JSXのspread先で予約語のkeyと衝突するのを避けるため
type NexusBlockProps = {
	// 片側のコードしか定まっておらず相対関係すら計算できない場合はundefined
	readonly relative: RelativeNexus | undefined;
	readonly degree: DegreeNexus | undefined;
	readonly keyLabel: PitchClass | undefined;
	readonly chords: ChordsDisplay;
};

// nexusの相対/度数/キー説明を表示する。chordsのformerStyle/latterStyleが両方hiddenでなければ接続元→接続先のコード名も表示する。
export function NexusBlock(props: NexusBlockProps) {
	const { relative, degree, keyLabel, chords } = props;
	const showChords = chords.formerStyle !== "hidden" || chords.latterStyle !== "hidden";
	return (
		<>
			{showChords && (
				<div className="nexus-block__chords">
					<span className={chordClassName(chords.formerStyle)}>{chordText(chords.formerChord, chords.formerStyle)}</span>
					<span className="nexus-block__arrow">→</span>
					<span className={chordClassName(chords.latterStyle)}>{chordText(chords.latterChord, chords.latterStyle)}</span>
				</div>
			)}

			<div className="nexus-block__relative">{relative ? relative.toString() : "-"}</div>
			<div className="nexus-block__degree">{degree ? degree.toString() : "unknown"}</div>
			<div className="nexus-block__key">{keyLabel ? `in key=${keyLabel.toString()}` : "-"}</div>
		</>
	);
}
