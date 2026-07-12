import { BasicChord } from "../../basics/basicChord";
import { ContextScale, knownScaleNames } from "../../basics/contextScale";
import { PitchClass } from "../../basics/pitch";
import { ScaleNexusBlock } from "../parts/nexusBlock";

type ContextScalePanelProps = {
	readonly formerChord: BasicChord;
	readonly latterChord: BasicChord;
	readonly contextScale: ContextScale | undefined;
	readonly onChange: (contextScale: ContextScale | undefined) => void;
};

function panelClassName(isAuto: boolean): string {
	return isAuto ? "context-scale-panel progression-editor__card context-scale-panel--auto" : "context-scale-panel progression-editor__card";
}

export function ContextScalePanel(props: ContextScalePanelProps) {
	const { formerChord, latterChord, contextScale, onChange } = props;

	const handleKeyChange = (value: string): void => {
		if (value === "") {
			onChange(undefined);
			return;
		}
		onChange({ key: PitchClass.all[Number(value)], name: contextScale?.name ?? knownScaleNames[0] });
	};

	const handleNameChange = (value: string): void => {
		if (value === "") {
			onChange(undefined);
			return;
		}
		onChange({ key: contextScale?.key ?? PitchClass.all[0], name: value });
	};

	return (
		<div className={panelClassName(contextScale === undefined)}>
			<ScaleNexusBlock contextScale={contextScale} formerChord={formerChord} latterChord={latterChord} />
			<div className="context-scale-panel__controls">
				<select
					className="context-scale-panel__select"
					value={contextScale ? String(contextScale.key.value) : ""}
					onChange={event => handleKeyChange(event.target.value)}
				>
					<option value="">Auto</option>
					{PitchClass.all.map(key => (
						<option key={key.value} value={key.value}>{key.toString()}</option>
					))}
				</select>
				<select
					className="context-scale-panel__select"
					value={contextScale?.name ?? ""}
					onChange={event => handleNameChange(event.target.value)}
				>
					<option value="">Auto</option>
					{knownScaleNames.map(name => (
						<option key={name} value={name}>{name}</option>
					))}
				</select>
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
