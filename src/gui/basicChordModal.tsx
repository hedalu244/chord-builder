import { useState } from "react";
import { allBasicChords, BasicChord } from "../basics/basicChord";
import { Modal } from "./parts/modal";
import { ChordTones } from "./parts/chordTones";
import { ChordEditTrigger } from "./progressionEditor";

// このモーダルのタイトル。挿入操作か既存コードの編集かで表示を分ける
function modalTitle(trigger: ChordEditTrigger): string {
	return trigger === "changeChord" ? "Select Chord" : "Insert Chord";
}

// 確定ボタンのラベル。挿入操作ではInsert/Add、既存コードの編集ではOKにする
function confirmButtonLabel(trigger: ChordEditTrigger): string {
	switch (trigger) {
		case "changeChord": return "OK";
		case "add": return "Add";
		case "insertBefore":
		case "insertAfter": return "Insert";
	}
}

function directButtonClassName(active: boolean): string {
	return active ? "basic-chord-modal__direct-button basic-chord-modal__direct-button--active" : "basic-chord-modal__direct-button";
}

type BasicChordModalProps = {
	readonly trigger: ChordEditTrigger;
	// nullの場合は「まだ何も選択していない」状態でモーダルを開く(挿入操作向け)
	readonly initialChord: BasicChord | null;
	readonly onConfirm: (chord: BasicChord) => void;
	readonly onCancel: () => void;
};

export function BasicChordModal(props: BasicChordModalProps) {
	const { trigger, initialChord, onConfirm, onCancel } = props;
	const [chord, setChord] = useState<BasicChord | null>(initialChord);

	return (
		<Modal
			className="basic-chord-modal"
			title={modalTitle(trigger)}
			onCancel={onCancel}
			onConfirm={() => chord && onConfirm(chord)}
			confirmLabel={confirmButtonLabel(trigger)}
			confirmDisabled={chord === null}
		>
			<div className="basic-chord-modal__direct-grid">
				{allBasicChords().map(candidate => (
					<button
						type="button"
						key={candidate.toString()}
						className={directButtonClassName(chord !== null && chord.equals(candidate))}
						onClick={() => setChord(candidate)}
					>
						<span>{candidate.toString()}</span>
						<ChordTones tones={candidate.getChordTones()} />
					</button>
				))}
			</div>
		</Modal>
	);
}
