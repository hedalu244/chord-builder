import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Interval, PitchClass } from "./basics/pitch";
import { ProgressionEditor } from "./gui/progressionEditor";
import { FullChordInfo } from "./basics/fullChordInfo";
import { BasicChord } from "./basics/basicChord";

function createDebugChordData(): FullChordInfo[] {
	return [
		new FullChordInfo(new BasicChord(new PitchClass(0), "major7")),
		new FullChordInfo(new BasicChord(new PitchClass(9), "minor7")),
		new FullChordInfo(new BasicChord(new PitchClass(7), "dominant7"))
	];
}

function App() {
	const [progression, setProgression] = useState<readonly FullChordInfo[]>(() => createDebugChordData());

	return (
		<main className="debug-app">
			<h2 className="debug-app__title">Chord Progression Editor Debug</h2>
			<p className="debug-app__info">
				Edit, insert, add, and delete chords. Current progression is logged in the browser console.
			</p>
			<ProgressionEditor
				value={progression}
				onChange={nextProgression => {
					setProgression(nextProgression);
					console.log("progression", nextProgression);
				}}
			/>
		</main>
	);
}

const mountNode = document.createElement("div");
document.body.appendChild(mountNode);

createRoot(mountNode).render(<App />);