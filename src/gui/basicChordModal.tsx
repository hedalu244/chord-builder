import { useState } from "react";
import { BasicChord, Mode } from "../basics/basicChord";
import { calcRelativeNexus, DegreeNexus, findNexiByFormerMode, findNexiByLatterMode } from "../basics/nexus";
import { PitchClass } from "../basics/pitch";
import { ChordEditContext, ChordEditMethod, defaultChordEditMethod } from "../editor";
import { formatKnownNexus } from "./nexusPanel";

const pitchClassOptions = Array.from({ length: 12 }, (_, index) => {
	const pitchClass = new PitchClass(index);
	return {
		value: index,
		label: pitchClass.toString()
	};
});

function flankClassName(active: boolean): string {
	return active ? "basic-chord-modal__flank basic-chord-modal__flank--active" : "basic-chord-modal__flank";
}

function nexusButtonClassName(active: boolean): string {
	return active ? "basic-chord-modal__nexus-button basic-chord-modal__nexus-button--active" : "basic-chord-modal__nexus-button";
}

// 探索によりKnownNexiとの一致を検出して表示する。一致しない場合はrelativeのみのフォールバック表示になる。
function NexusDisplay(props: { readonly formerChord: BasicChord; readonly latterChord: BasicChord }) {
	const { relative, degree, key } = formatKnownNexus(props.formerChord, props.latterChord);
	return (
		<>
			<div className="basic-chord-modal__nexus-relative">{relative}</div>
			<div className="basic-chord-modal__nexus-degree">{degree}</div>
			<div className="basic-chord-modal__nexus-key">{key}</div>
		</>
	);
}

function nexusChordClassName(emphasized: boolean): string {
	return emphasized ? "basic-chord-modal__nexus-chord" : "basic-chord-modal__nexus-chord basic-chord-modal__nexus-chord--muted";
}

type NexusCandidateListProps = {
	readonly candidates: readonly DegreeNexus[];
	readonly anchorChord: BasicChord;
	readonly anchorRole: "former" | "latter";
	readonly selected: DegreeNexus | null;
	readonly onSelect: (nexus: DegreeNexus) => void;
};

// ボタンごとに固有のnexusが分かっているので、探索ではなく直接、former/latter/relative/degree/keyを求める。
function NexusCandidateList(props: NexusCandidateListProps) {
	const { candidates, anchorChord, anchorRole, selected, onSelect } = props;
	return (
		<div className="basic-chord-modal__nexus-list">
			{candidates.map((nexus, index) => {
				const formerChord = anchorRole === "former" ? anchorChord : nexus.resolveFormerChord(anchorChord);
				const latterChord = anchorRole === "latter" ? anchorChord : nexus.resolveLatterChord(anchorChord);
				const key = anchorRole === "former"
					? nexus.resolveKeyFromFormerRoot(anchorChord.root)
					: nexus.resolveKeyFromLatterRoot(anchorChord.root);
				const relative = calcRelativeNexus(formerChord, latterChord).toString();

				return (
					<button type="button" key={index} className={nexusButtonClassName(nexus === selected)} onClick={() => onSelect(nexus)}>
						<div className="basic-chord-modal__nexus-chords">
							<span className={nexusChordClassName(anchorRole !== "former")}>{formerChord.toString()}</span>
							<span className="basic-chord-modal__nexus-arrow">→</span>
							<span className={nexusChordClassName(anchorRole !== "latter")}>{latterChord.toString()}</span>
						</div>
						<div className="basic-chord-modal__nexus-relative">{relative}</div>
						<div className="basic-chord-modal__nexus-degree">{nexus.toString()}</div>
						<div className="basic-chord-modal__nexus-key">{`in key=${key.toString()}`}</div>
					</button>
				);
			})}
		</div>
	);
}

type BasicChordModalProps = {
	readonly context: ChordEditContext;
	readonly initialChord: BasicChord;
	readonly onConfirm: (chord: BasicChord) => void;
	readonly onCancel: () => void;
};

export function BasicChordModal(props: BasicChordModalProps) {
	const { context, initialChord, onConfirm, onCancel } = props;
	const [method, setMethod] = useState<ChordEditMethod>(() => defaultChordEditMethod(context.trigger));
	const [chord, setChord] = useState<BasicChord>(initialChord);
	const [selectedNexusA, setSelectedNexusA] = useState<DegreeNexus | null>(null);
	const [selectedNexusB, setSelectedNexusB] = useState<DegreeNexus | null>(null);

	const previousChord = context.previousChord?.chord ?? null;
	const nextChord = context.nextChord?.chord ?? null;

	const selectFromFormer = (nexus: DegreeNexus): void => {
		if (!previousChord) return;
		setChord(nexus.resolveLatterChord(previousChord));
		setSelectedNexusA(nexus);
	};
	const selectFromLatter = (nexus: DegreeNexus): void => {
		if (!nextChord) return;
		setChord(nexus.resolveFormerChord(nextChord));
		setSelectedNexusB(nexus);
	};

	return (
		<div className="basic-chord-modal__backdrop">
			<div className="basic-chord-modal">
				<div className="basic-chord-modal__flank-row">
					<button type="button" className={flankClassName(method === "formerNexus")} onClick={() => setMethod("formerNexus")}>
						{context.previousChord && previousChord ? (
							<>
								<div className="basic-chord-modal__flank-neighbor">{`${context.previousChord.toString()}→`}</div>
								<NexusDisplay formerChord={previousChord} latterChord={chord} />
							</>
						) : <span className="basic-chord-modal__flank-placeholder">–</span>}
					</button>
					<button type="button" className={`${flankClassName(method === "direct")} basic-chord-modal__flank--center`} onClick={() => setMethod("direct")}>
						{chord.toString()}
					</button>
					<button type="button" className={flankClassName(method === "latterNexus")} onClick={() => setMethod("latterNexus")}>
						{context.nextChord && nextChord ? (
							<>
								<div className="basic-chord-modal__flank-neighbor">{`→${context.nextChord.toString()}`}</div>
								<NexusDisplay formerChord={chord} latterChord={nextChord} />
							</>
						) : <span className="basic-chord-modal__flank-placeholder">–</span>}
					</button>
				</div>

				{method === "formerNexus" && (
					previousChord ? (
						<NexusCandidateList
							candidates={findNexiByFormerMode(previousChord.mode)}
							anchorChord={previousChord}
							anchorRole="former"
							selected={selectedNexusA}
							onSelect={selectFromFormer}
						/>
					) : <p className="basic-chord-modal__hint">前のコードがありません</p>
				)}
				{method === "latterNexus" && (
					nextChord ? (
						<NexusCandidateList
							candidates={findNexiByLatterMode(nextChord.mode)}
							anchorChord={nextChord}
							anchorRole="latter"
							selected={selectedNexusB}
							onSelect={selectFromLatter}
						/>
					) : <p className="basic-chord-modal__hint">次のコードがありません</p>
				)}
				{method === "direct" && (
					<div className="basic-chord-modal__field-row">
						<select
							className="basic-chord-modal__control"
							value={String(chord.root.value)}
							onChange={event => setChord(new BasicChord(new PitchClass(Number(event.target.value)), chord.mode))}
						>
							{pitchClassOptions.map(option => (
								<option key={option.value} value={String(option.value)}>{option.label}</option>
							))}
						</select>
						<select
							className="basic-chord-modal__control"
							value={chord.mode}
							onChange={event => setChord(new BasicChord(chord.root, event.target.value as Mode))}
						>
							<option value="M">major</option>
							<option value="m">minor</option>
						</select>
					</div>
				)}

				<div className="basic-chord-modal__actions">
					<button type="button" className="basic-chord-modal__cancel-button" onClick={onCancel}>Cancel</button>
					<button type="button" className="basic-chord-modal__confirm-button" onClick={() => onConfirm(chord)}>OK</button>
				</div>
			</div>
		</div>
	);
}
