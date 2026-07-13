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


一つ前のセッションで、editor.tsとprogressionEditor.tsx、basicChordModal、nexusChangeModalに大幅な

## 選択とトランスポーズ
chordpanel直下にチェックボックスを追加

選択したコードを一括してトランスポーズするUI

KnownNexiの定義を充実させたい。
相対的な同一視で減らすと、2*23=46通り
相対的な同一視をしないと、24*23=552通り
I, IIm, IIIm, IV, V, VIm, の6つの組み合わせでできるのは、6*5=30通り

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

