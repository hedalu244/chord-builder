import { BasicChord } from "../../basics/basicChord";
import { ContextScale } from "../../basics/contextScale";
import { IconButton } from "../parts/iconButton";
import { ScaleNexusBlock } from "../parts/nexusBlock";

type ContextScalePanelProps = {
	readonly formerChord: BasicChord | undefined;
	readonly latterChord: BasicChord | undefined;
	readonly contextScale: ContextScale | undefined;
	readonly onChange: (contextScale: ContextScale | undefined) => void;
	readonly onEdit: () => void;
};

function panelClassName(isAuto: boolean): string {
	return isAuto ? "context-scale-panel progression-editor__card context-scale-panel--auto" : "context-scale-panel progression-editor__card";
}

// NOTE: ContextScaleModalはここでは持たない。.context-scale-panelはtransformを持ち
// position:fixedの包含ブロックになってしまうため、モーダルはProgressionEditor側で開閉する
export function ContextScalePanel(props: ContextScalePanelProps) {
	const { formerChord, latterChord, contextScale, onChange, onEdit } = props;

	return (
		<div className={panelClassName(contextScale === undefined)}>
			<ScaleNexusBlock contextScale={contextScale} formerChord={formerChord} latterChord={latterChord} />
			<div className="context-scale-panel__controls">
				<IconButton icon="icons/edit.svg" label="Change" onClick={onEdit} />
				<IconButton icon="icons/delete.svg" label="Delete" className="icon-button--delete" onClick={() => onChange(undefined)} />
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
