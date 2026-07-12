import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Interval, PitchClass } from "./basics/pitch";
import { ProgressionEditor } from "./gui/progressionEditor";
import { ChordEntry } from "./basics/progression";
import { Chord } from "./basics/chord";
import { Triad } from "./basics/triad";
import { colorSchemeClassName } from "./gui/colorScheme/colorSchemeSelect";
import { ColorSchemeProvider, useColorScheme } from "./gui/colorScheme/colorSchemeContext";
import { ColorSchemeSelect } from "./gui/colorScheme/colorSchemeSelect";

// triadと、そのrootからの音程値配列(重複可)から初期表示用のChordを作る
function createChord(triad: Triad, intervalValues: readonly number[]): Chord {
	return new Chord(triad, intervalValues.map(value => triad.root.add(new Interval(value))));
}

function createInitialProgression(): (ChordEntry | undefined)[] {
	return [
		{ chord: createChord(new Triad(new PitchClass(0), "M"), [0, 4, 7, 11]), extraChordScaleTones: undefined },
		{ chord: createChord(new Triad(new PitchClass(9), "m"), [0, 3, 7, 10]), extraChordScaleTones: undefined },
		{ chord: createChord(new Triad(new PitchClass(7), "M"), [0, 4, 7, 10]), extraChordScaleTones: undefined }
	];
}

function App() {
	const [progression, setProgression] = useState<readonly (ChordEntry | undefined)[]>(() => createInitialProgression());
	const { colorScheme } = useColorScheme();

	return (
		<main className={`app ${colorSchemeClassName(colorScheme)}`}>
			<div className="app__header">
				<h2 className="app__title">Chord Progression Editor</h2>
				<ColorSchemeSelect />
			</div>
			<ProgressionEditor
				value={progression}
				onChange={setProgression}
			/>
		</main>
	);
}

const mountNode = document.createElement("div");
mountNode.className = "app-root";
document.body.appendChild(mountNode);

createRoot(mountNode).render(
	<ColorSchemeProvider>
		<App />
	</ColorSchemeProvider>
);