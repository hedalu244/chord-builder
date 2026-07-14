## 積極的に採用するパラダイム


接続のキーをシフトすることで12個の接続を表現する。

## ToDoメモ
コードを以下のように分解して解釈する。
1. ルート、クオリティ（メジャーかマイナーか、4和音までの変種、構成音）
2. コードスケール（7～8和音への拡張）
3. ヴォイシング情報（コードスケールの中での音の選択と配置）

DegreeNexusを視覚的に表現するためのモジュールを作ります。

目指している視覚化は、五度圏と呼ばれるもののうち、特にbasicChordの表示に適したものです。以下のようになります。

全体は大きく二重の円で構成される。

五度圏は二重の

### ヴォイシング情報
コードスケールの中での音の選択と配置

## 追加機能案
ノート、タグ、コンテクスト、スコアによる検索。

ノート機能。

ロック機能？

五度圏表示

ピアノロール表示、ボイシング表示
音を鳴らしたい。さすがにね。

KnownNexiの定義を充実させたい。
相対的な同一視で減らすと、2*23=46通り
相対的な同一視をしないと、24*23=552通り
I, IIm, IIIm, IV, V, VIm, の6つの組み合わせでできるのは、6*5=30通り


一つ前のセッションで、editor.tsとprogressionEditor.tsx、basicChordModal、nexusChangeModalに大幅な

## chordModalにおけるtonnetzの表示（挙動は現行と変更なし）
chordModal側でのEmphasisは、現状以下のようにふるまっています。

通常時は、currentがnormal表示、それ以外はvisibleがtrueならfaint表示、visibleがfalseならhidden
current以外contextStrip上でホバーすると、ホバーした要素がnormal表示になり、currentがfaint表示。それ以外は通常時と同じ
現状、currentをホバーしても何も起きない、currentのvisiblityをfalseにすることはできないので、tonnetzLayerの構築においてそれらを考慮する必要はない

言い換えると
current以外は、それがhoverされていればnormal、それのvisiblityがtrueならfaint、そうでなければhidden
currentは、なにかがhoverされていればfaint、そうでなければnormal


## contextScaleModalにおけるtonnetzの表示
contextScaleModal側でのEmphasisを以下のように決定します。

通常時は、currentScaleがfaint表示、それ以外はchordはvisibleがtrueならnormal表示、visibleがfalseならhidden。scaleはvisibleがtrueならfaint表示、visibleがfalseならhidden。
hoverScaleがある場合は、hoverScaleがfaint表示、currentScaleがhidden
current以外contextStrip上でホバーすると、ホバーした要素がnormal表示になり、currentがfaint表示。それ以外は通常時と同じ
現状、currentをホバーしても何も起きない、currentのvisiblityをfalseにすることはできないので、tonnetzLayerの構築においてそれらを考慮する必要はない


contextScaleModalとchordModalに共通したルール：
1. contextStrip上でhoverされているものはchordでもscaleでもnormal表示
2. visibleがfalseのものはchordでもscaleでもhidden表示
3. current以外をhoverしている場合、currentはfaint表示
4. scaleのデフォルトはfaint

異なる点：
1. chordの表示ルール。chordModalにおいて、chordのデフォルトは、currentChordはnoraml,formerChordとlatterChordはfaint。一方、
contextScaleModalにおいて、chordのデフォルトはnormal表示

2. hoverScale/hoverChord（tonnetz上でクリックした時に得られるであろうコードやスケールがあったとき）の表示ルールを以下のように改めます。

chordModalにおいて、hoverChordはfaint表示で、currentはnormalのまま（変更なし）。一方、contextScaleModalにおいて、hoverScaleはfaint表示で、currentScaleはfaint表示のまま。

## 選択とトランスポーズ
chordpanel直下にチェックボックスを追加

選択したコードを一括してトランスポーズするUI


## 混同しやすい命名規則

chordやscaleの隣接関係について、former latterを使用する。
prev/nextは、編集履歴などのために空けておく

### scaleなどについて
一般にscaleは重複なしで構成音をまとめたもの。
chordScaleとcontextScaleの区別は絶対に必要。

chordScaleはchordの構成音にextraScaleTonesを加えたもの。
contextScaleは前後のchordの関係をdegreeで表すためのスケール。
contextは前後のchordと前後のcontextScaleをまとめた局所構造を表す。

混同の恐れがない場合はcontextScaleを単にscaleと呼ぶことができる。
chordScaleは**必ず**有標のchordScaleとする。


### keyとrootについて
keyはparentScaleの主音、rootはsfhift後の主音ということにしたい。理由は、chordScaleの文脈では主音をrootと呼ぶことが一般的であり、contextScaleの文脈では主音をkeyと呼ぶことが一般的であるから。


