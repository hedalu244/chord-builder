import { Triad } from "../../basics/triad";
import { ContextScale } from "../../basics/contextScale";
import { IconButton } from "../parts/iconButton";
import { ScaleNexusBlock } from "../parts/nexusBlock";

type AutoContextScalePanelProps = {
	readonly formerChord: Triad | undefined;
	readonly latterChord: Triad | undefined;
	readonly onEdit: () => void;
};

export function AutoContextScalePanel(props: AutoContextScalePanelProps) {
	const { formerChord, latterChord, onEdit } = props;

	// undefinedで自動計算させる。
	return (
		<div className="context-scale-panel progression-editor__placeholder">
			<ScaleNexusBlock contextScale={undefined} formerChord={formerChord} latterChord={latterChord} />
			<div className="context-scale-panel__controls">
				<IconButton icon="icons/edit.svg" label="Change" onClick={onEdit} />
			</div>
		</div>
	);
}


type ContextScalePanelProps = {
	readonly contextScale: ContextScale;
	readonly formerChord: Triad | undefined;
	readonly latterChord: Triad | undefined;
	readonly onDelete: () => void;
	readonly onEdit: () => void;
};

// NOTE: ContextScaleModalはここでは持たない。.context-scale-panelはtransformを持ち
// position:fixedの包含ブロックになってしまうため、モーダルはProgressionEditor側で開閉する
export function ContextScalePanel(props: ContextScalePanelProps) {
	const { contextScale, formerChord, latterChord, onDelete, onEdit } = props;

	return (
		<div className="context-scale-panel progression-editor__card">
			<ScaleNexusBlock contextScale={contextScale} formerChord={formerChord} latterChord={latterChord} />
			<div className="context-scale-panel__controls">
				<IconButton icon="icons/edit.svg" label="Change" onClick={onEdit} />
				<IconButton icon="icons/delete.svg" label="Delete" className="icon-button--delete" onClick={onDelete} />
			</div>
		</div>
	);
}

export function DummyContextScalePanel() {
	return (
		<div className="context-scale-panel progression-editor__card context-scale-panel--dummy">
		</div>
	);
}