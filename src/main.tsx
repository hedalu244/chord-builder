import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Interval, PitchClass } from "./basics/pitch";
import { ProgressionEditor } from "./gui/progressionEditor";
import { ChordEntry } from "./editor/chordEntry";
import { Chord } from "./basics/chord";
import { ProgressionValue } from "./editor/progression";
import { ScaleInfo } from "./basics/scaleInfo";
import { contextScaleNames } from "./basics/scaleDictionary";
import { Triad } from "./basics/triad";
import { generateVoicing } from "./basics/voicing";
import { ColorSchemeProvider } from "./gui/colorScheme/colorSchemeContext";
import { ColorSchemeSelect } from "./gui/colorScheme/colorSchemeSelect";

// triadと、そのrootからの音程値配列(重複可)から初期表示用のChordを作る
function createChord(triad: Triad, intervalValues: readonly number[]): Chord {
	return new Chord(triad, intervalValues.map(value => triad.root.add(new Interval(value))));
}

function createEntry(chord: Chord): ChordEntry {
	return new ChordEntry(chord, undefined, generateVoicing(chord));
}

function createInitialProgression(): ProgressionValue {
	const entries = [
		createEntry(createChord(new Triad(new PitchClass(0), "M"), [0, 4, 7, 11])),
		createEntry(createChord(new Triad(new PitchClass(9), "m"), [0, 3, 7, 10])),
		createEntry(createChord(new Triad(new PitchClass(7), "M"), [0, 4, 7, 10]))
	];
	// 1つ目のcontextScaleは削除できないため、初期状態から適当な値を指定しておく
	const scales: (ScaleInfo | undefined)[] = entries.map(() => undefined);
	scales[0] = new ScaleInfo(new PitchClass(0), contextScaleNames[0], 0);
	return { entries, scales };
}

function App() {
	const [progression, setProgression] = useState<ProgressionValue>(() => createInitialProgression());

	return (
		<main className="app">
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