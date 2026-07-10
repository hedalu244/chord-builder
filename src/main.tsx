import { useState } from "react";
import { createRoot } from "react-dom/client";
import { PitchClass } from "./basics/pitch";
import { ProgressionEditor } from "./gui/progressionEditor";
import { FullChordInfo } from "./basics/fullChordInfo";
import { BasicChord } from "./basics/basicChord";

function createInitialProgression(): FullChordInfo[] {
	return [
		new FullChordInfo(new BasicChord(new PitchClass(0), "M"), "major7"),
		new FullChordInfo(new BasicChord(new PitchClass(9), "m"), "minor7"),
		new FullChordInfo(new BasicChord(new PitchClass(7), "M"), "dominant7")
	];
}

function App() {
	const [progression, setProgression] = useState<readonly FullChordInfo[]>(() => createInitialProgression());

	return (
		<main className="app">
			<h2 className="app__title">Chord Progression Editor</h2>
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

createRoot(mountNode).render(<App />);