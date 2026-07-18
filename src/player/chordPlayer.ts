import * as Tone from "tone";
import { Voicing } from "../basics/voicing";

// 和音1回分の再生時間(秒)
const PLAY_DURATION = 1.5;

// シンセはアプリ全体で1つを使い回す。ブラウザのAudioContextはユーザー操作後でないと
// 開始できないため、最初の再生要求まで生成を遅延する
let synth: Tone.PolySynth | null = null;

function getSynth(): Tone.PolySynth {
    if (synth === null) {
        synth = new Tone.PolySynth(Tone.Synth, { volume: -8 }).toDestination();
    }
    return synth;
}

// ボイシングを一定時間鳴らす。再生中に再度呼ばれた場合は、鳴っている音を
// キャンセルして鳴らし直す
export async function playVoicing(voicing: Voicing): Promise<void> {
    await Tone.start();
    const player = getSynth();
    player.releaseAll();
    const frequencies = voicing.map(note => Tone.Frequency(note, "midi").toFrequency());
    player.triggerAttackRelease(frequencies, PLAY_DURATION);
}

// 再生中の音を即座に止める(モーダルを閉じたときなど)
export function stopVoicing(): void {
    synth?.releaseAll();
}
