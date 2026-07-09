import { Interval, PitchClass } from "./basics/pitch";
import { FullChordInfo } from "./gui/chordPanel";
import { createProgressionEditor } from "./gui/progressionEditor";

function createDebugChordData(): FullChordInfo[] {
	return [
		{
			chord: { root: new PitchClass(0), quality: "major" },
			variant: {
				name: "major7",
				baseQuality: "major",
				intervals: Interval.map([0, 4, 7, 11])
			}
		},
		{
			chord: { root: new PitchClass(9), quality: "minor" },
			variant: {
				name: "minor7",
				baseQuality: "minor",
				intervals: Interval.map([0, 3, 7, 10])
			}
		},
		{
			chord: { root: new PitchClass(7), quality: "major" },
			variant: {
				name: "dominant7",
				baseQuality: "major",
				intervals: Interval.map([0, 4, 7, 10])
			}
		}
	];
}

function renderDebugPanels(chords: FullChordInfo[]): void {
	const app = document.createElement("main");
	app.className = "debug-app";

	const title = document.createElement("h2");
	title.textContent = "Chord Progression Editor Debug";
	title.className = "debug-app__title";
	app.appendChild(title);

	const info = document.createElement("p");
	info.textContent = "Edit, insert, add, and delete chords. Current progression is logged in the browser console.";
	info.className = "debug-app__info";
	app.appendChild(info);

	const editor = createProgressionEditor(chords, nextProgression => {
		console.log("progression", nextProgression);
	});
	app.appendChild(editor.element);

	document.body.appendChild(app);
}

renderDebugPanels(createDebugChordData());