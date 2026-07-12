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


placeholderのUXが悪い。

とりあえず、プレースホルダーに関してはprogression.tsで管理したものが、ほぼそのまま画面に表れるように責務が分離されているはず。今後もprogression.tsが責務を持つべきで、progressionEditor.tsxはその表示に徹するべき。

progressionは、contextの配列とchordの配列に対して独立にそれぞれset, delete、insert、shiftを行うことができる。これが操作の最小単位になる。
さらにヘルパーとして、配列の末尾に必要数までplaceholderを追加するpad関数、shiftする前にshiftが可能か判定するcanShift関数が

配列に操作をするときには、以下の要件が満たされるようにする。

contextの配列と、chordの配列はsparceつまりemptyを含んではならない。indexを飛ばして指定することは許されず、中間にはplaceholderを必ず間に入れる。
contextの配列の長さは、chordの配列の長さと同じか、1つ短くなければならない。もし崩れていた場合は、足りない方の末尾にplaceholderを追加する。
contextの配列とchordの配列の末尾はそれぞれplaceholderである必要がある。もし末尾にsetしたことでそれが崩れた場合、placeholderを追加する。
shiftは末尾以外のplaceholderのみを削除することができ、末尾のplaceholderと、非placeholderデータは削除することができない。
insertはplaceholderを追加することだけができ、実データを追加することはない。

deleteやsetでは配列の要素が移動することはない。
deleteは、sparceを避けるため、指定されたインデックスが配列外であれば何もせず、配列内であればその要素をplaceholderに置き換える。
setは、指定されたインデックスが配列内であればその要素を置き換える。配列外であれば、sparceを避けるため必要数のplaceholderを追加してから置き換える。

shiftとinsertでは配列の要素が移動する。これらについては、追加の制約がある。
placeholderを区別しなかった場合と同じ結果が得られる限り、できるだけ後方に対して操作をする。これはplaceholderが無駄に動くアニメーションを生まないためである（idがずれなければアニメーションは起きないはずですよね？）

insertはplaceholderのみを挿入できる。ただし、placeholderの前に要素を追加しようとしているときに、その一つ後ろの要素がplaceholderであれば、そちらに追加する。再帰の結果末尾に至った場合には、末尾のplaceholderの後ろに追加する。

shiftはplaceholderのみを削除できる。ただしshiftしようとしているときに、その一つ後ろの要素もplaceholderであれば、そちらを優先してshiftする。さらにその後ろがplaceholderであっても再帰的に同様。
ただし、再帰の結果、末尾に至った場合には、末尾のplaceholderをshiftする。
直接末尾のplaceholderをshiftすることはできないし、canShiftもfalseになることに注意。

setとdeleteは公開されている。insertBefore、shiftBefore、insertAfter、shiftAfter、canShiftBefore、canShiftAfterは両方の配列に対してinsertやshift、canShiftを呼び出すラッパーとして公開されている。。

このように、contextとchordの配列は個数の大小関係以外独立であり、さらに操作も対称に存在していることに注意する。コードが長くなりそうなので、
{ value:T|undefined, id }[]を管理する PlaceholderArrayWithId<T>みたいなクラスを作って抽象化すべきかも。