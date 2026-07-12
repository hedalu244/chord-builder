import { useState } from "react";
import { createRoot } from "react-dom/client";
import { PitchClass } from "./basics/pitch";
import { ProgressionEditor } from "./gui/progressionEditor";
import { FullChordInfo } from "./basics/fullChordInfo";
import { BasicChord } from "./basics/basicChord";
import { colorSchemeClassName } from "./gui/colorScheme/colorSchemeSelect";
import { ColorSchemeProvider, useColorScheme } from "./gui/colorScheme/colorSchemeContext";
import { ColorSchemeSelect } from "./gui/colorScheme/colorSchemeSelect";

function createInitialProgression(): (FullChordInfo | undefined)[] {
	return [
		new FullChordInfo(new BasicChord(new PitchClass(0), "M"), "major7"),
		new FullChordInfo(new BasicChord(new PitchClass(9), "m"), "minor7"),
		new FullChordInfo(new BasicChord(new PitchClass(7), "M"), "dominant7")
	];
}

function App() {
	const [progression, setProgression] = useState<readonly (FullChordInfo | undefined)[]>(() => createInitialProgression());
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