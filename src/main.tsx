import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Interval, PitchClass } from "./basics/pitch";
import { ProgressionEditor } from "./gui/progressionEditor";
import { FullChordInfo } from "./basics/fullChordInfo";

function createDebugChordData(): FullChordInfo[] {
	return [
		{
			chord: { root: new PitchClass(0), quality: "major" },
			variant: {
				name: "major7",
				intervals: Interval.map([0, 4, 7, 11])
			}
		},
		{
			chord: { root: new PitchClass(9), quality: "minor" },
			variant: {
				name: "minor7",
				intervals: Interval.map([0, 3, 7, 10])
			}
		},
		{
			chord: { root: new PitchClass(7), quality: "major" },
			variant: {
				name: "dominant7",
				intervals: Interval.map([0, 4, 7, 10])
			}
		}
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