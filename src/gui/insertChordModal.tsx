import { useState } from "react";
import { BasicChord } from "../basics/basicChord";
import { ChordQualityId, findChordQuality, findQualitiesByMode, Mode } from "../basics/chordQuality";
import { FullChordInfo } from "../basics/fullChordInfo";
import { DegreeNexus, findNexiByFormerMode, findNexiByLatterMode } from "../basics/nexus";
import { PitchClass } from "../basics/pitch";
import { defaultInsertMethod, InsertContext, InsertMethod } from "../editor";
import { pitchClassOptions } from "./chordPanel";
import { formatKnownNexus } from "./nexusPanel";

type Selection = {
	readonly root: PitchClass;
	readonly mode: Mode;
	readonly qualityId: ChordQualityId;
};

function defaultSelection(): Selection {
	const chord = FullChordInfo.createDefault().chord;
	return { root: chord.root, mode: findChordQuality(chord.qualityId).mode, qualityId: chord.qualityId };
}

function withRootMode(current: Selection, root: PitchClass, mode: Mode): Selection {
	const qualities = findQualitiesByMode(mode);
	const qualityId = qualities.some(quality => quality.id === current.qualityId) ? current.qualityId : qualities[0].id as ChordQualityId;
	return { root, mode, qualityId };
}

function formatRootMode(root: PitchClass, mode: Mode): string {
	return mode === "minor" ? `${root.toString()}m` : root.toString();
}

function flankClassName(active: boolean): string {
	return active ? "insert-chord-modal__flank insert-chord-modal__flank--active" : "insert-chord-modal__flank";
}

function nexusButtonClassName(active: boolean): string {
	return active ? "insert-chord-modal__nexus-button insert-chord-modal__nexus-button--active" : "insert-chord-modal__nexus-button";
}

function NexusDisplay(props: { readonly formerChord: BasicChord; readonly latterChord: BasicChord }) {
	const { degree, key } = formatKnownNexus(props.formerChord, props.latterChord);
	return (
		<>
			<div className="insert-chord-modal__flank-degree">{degree}</div>
			<div className="insert-chord-modal__flank-key">{key}</div>
		</>
	);
}

type NexusCandidateListProps = {
	readonly candidates: readonly DegreeNexus[];
	readonly resolveKey: (nexus: DegreeNexus) => PitchClass;
	readonly selected: DegreeNexus | null;
	readonly onSelect: (nexus: DegreeNexus) => void;
};

function NexusCandidateList(props: NexusCandidateListProps) {
	const { candidates, resolveKey, selected, onSelect } = props;
	return (
		<div className="insert-chord-modal__nexus-list">
			{candidates.map((nexus, index) => (
				<button type="button" key={index} className={nexusButtonClassName(nexus === selected)} onClick={() => onSelect(nexus)}>
					<div className="insert-chord-modal__nexus-degree">{nexus.toString()}</div>
					<div className="insert-chord-modal__nexus-key">{`in key=${resolveKey(nexus).toString()}`}</div>
				</button>
			))}
		</div>
	);
}

type InsertChordModalProps = {
	readonly context: InsertContext;
	readonly onConfirm: (chord: BasicChord) => void;
	readonly onCancel: () => void;
};

export function InsertChordModal(props: InsertChordModalProps) {
	const { context, onConfirm, onCancel } = props;
	const [method, setMethod] = useState<InsertMethod>(() => defaultInsertMethod(context.trigger));
	const [selection, setSelection] = useState<Selection>(defaultSelection);
	const [selectedNexusA, setSelectedNexusA] = useState<DegreeNexus | null>(null);
	const [selectedNexusB, setSelectedNexusB] = useState<DegreeNexus | null>(null);

	const previousChord = context.previousChord?.chord ?? null;
	const nextChord = context.nextChord?.chord ?? null;
	const selectionChord = new BasicChord(selection.root, selection.qualityId);
	const qualities = findQualitiesByMode(selection.mode);

	const selectFromFormer = (nexus: DegreeNexus): void => {
		if (!previousChord) return;
		setSelection(current => withRootMode(current, nexus.resolveLatterRoot(previousChord.root), nexus.relativeNexus.latterMode));
		setSelectedNexusA(nexus);
	};
	const selectFromLatter = (nexus: DegreeNexus): void => {
		if (!nextChord) return;
		setSelection(current => withRootMode(current, nexus.resolveFormerRoot(nextChord.root), nexus.relativeNexus.formerMode));
		setSelectedNexusB(nexus);
	};

	return (
		<div className="insert-chord-modal__backdrop">
			<div className="insert-chord-modal">
				<div className="insert-chord-modal__flank-row">
					{previousChord && <div className="insert-chord-modal__context-chord">{previousChord.toString()}</div>}
					<button type="button" className={flankClassName(method === "formerNexus")} onClick={() => setMethod("formerNexus")}>
						{previousChord
							? <NexusDisplay formerChord={previousChord} latterChord={selectionChord} />
							: <span className="insert-chord-modal__flank-placeholder">–</span>}
					</button>
					<button type="button" className={`${flankClassName(method === "direct")} insert-chord-modal__flank--center`} onClick={() => setMethod("direct")}>
						{formatRootMode(selection.root, selection.mode)}
					</button>
					<button type="button" className={flankClassName(method === "latterNexus")} onClick={() => setMethod("latterNexus")}>
						{nextChord
							? <NexusDisplay formerChord={selectionChord} latterChord={nextChord} />
							: <span className="insert-chord-modal__flank-placeholder">–</span>}
					</button>
					{nextChord && <div className="insert-chord-modal__context-chord">{nextChord.toString()}</div>}
				</div>

				{method === "formerNexus" && (
					previousChord ? (
						<NexusCandidateList
							candidates={findNexiByFormerMode(findChordQuality(previousChord.qualityId).mode)}
							resolveKey={nexus => nexus.resolveKeyFromFormerRoot(previousChord.root)}
							selected={selectedNexusA}
							onSelect={selectFromFormer}
						/>
					) : <p className="insert-chord-modal__hint">前のコードがありません</p>
				)}
				{method === "latterNexus" && (
					nextChord ? (
						<NexusCandidateList
							candidates={findNexiByLatterMode(findChordQuality(nextChord.qualityId).mode)}
							resolveKey={nexus => nexus.resolveKeyFromLatterRoot(nextChord.root)}
							selected={selectedNexusB}
							onSelect={selectFromLatter}
						/>
					) : <p className="insert-chord-modal__hint">次のコードがありません</p>
				)}
				{method === "direct" && (
					<div className="insert-chord-modal__field-row">
						<select
							className="insert-chord-modal__control"
							value={String(selection.root.value)}
							onChange={event => setSelection(current => withRootMode(current, new PitchClass(Number(event.target.value)), current.mode))}
						>
							{pitchClassOptions.map(option => (
								<option key={option.value} value={String(option.value)}>{option.label}</option>
							))}
						</select>
						<select
							className="insert-chord-modal__control"
							value={selection.mode}
							onChange={event => setSelection(current => withRootMode(current, current.root, event.target.value as Mode))}
						>
							<option value="major">major</option>
							<option value="minor">minor</option>
						</select>
					</div>
				)}

				<hr className="insert-chord-modal__divider" />

				<div className="insert-chord-modal__step3">
					<div className="insert-chord-modal__chord-name">{selectionChord.toString()}</div>
					<select
						className="insert-chord-modal__control"
						value={selection.qualityId}
						onChange={event => setSelection(current => ({ ...current, qualityId: event.target.value as ChordQualityId }))}
					>
						{qualities.map(quality => (
							<option key={quality.id} value={quality.id}>{quality.notation}</option>
						))}
					</select>
				</div>

				<div className="insert-chord-modal__actions">
					<button type="button" className="insert-chord-modal__cancel-button" onClick={onCancel}>Cancel</button>
					<button type="button" className="insert-chord-modal__confirm-button" onClick={() => onConfirm(selectionChord)}>OK</button>
				</div>
			</div>
		</div>
	);
}
