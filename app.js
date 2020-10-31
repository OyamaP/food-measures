// Define //

// データ定義
class SeasoningsData {
    constructor(tsp,tbsp,cup){
        this['小さじ'] = tsp;
        this['大さじ'] = tbsp;
        this['カップ'] = cup;
    };
}
const seasonings = [
    // 名前,小さじ,大さじ,カップ

    // 利用頻度を考慮
    ['上白糖(砂糖)',3,9,130],
    ['グラニュー糖',4,12,180],
    ['食塩',6,18,240],
    ['粗塩',5,15,180],
    ['バター・マーガリン',4,12,180],
    ['小麦粉(薄力・強力)',3,9,110],
    ['ベーキングパウダー',4,12,150],
    ['重曹',4,12,190],
    
    // 一般調味料系
    ['水',5,15,200],
    ['酒',5,15,200],
    ['酢',5,15,200],
    ['しょうゆ',6,18,230],
    ['みりん',6,18,230],
    ['味噌',6,18,230],
    ['油・オリーブ油・ごま油',4,12,180],

    // その他
    ['牛乳',5,15,210],
    ['ヨーグルト',5,15,210],
    ['片栗粉',3,9,130],
    ['パン粉',1,3,40],
    ['カレー粉',2,6,80],

];

// データ生成
const data = new Object();
// 名前(key)={小さじ,大さじ,カップ}(value)でdataオブジェクトに生成
seasonings.forEach(i => data[i[0]] = new SeasoningsData(i[1],i[2],i[3]));

// app 取得
const $app = document.getElementById('app');

// drag $source 要素の移動に使用
let $source;



// Function //


// オブジェクト=>イベントリスナ
// 複数のイベントを同時設定する際に使用する
// (ex) setEvent(element,{eventA:function1,eventB:function2},false);
const setEvent = (ele,events,boolean) => {
    for(let key in events){
        ele.addEventListener(key,events[key],boolean);
    }
}


// DOM //


// 枠組み生成
const createOuter = (frame,title,id,btn) => {
    const $outer = document.createElement('div');
    $outer.id = frame;
    $outer.classList.add('updown');
    $outer.innerHTML = `
        <div class="heading">
            ${title}
            <span class="moveBtn ${btn}"></span>
        </div>
        <div class="wrap">
            <ul id="${id}" class="list"></ul>
        </div>
    `;
    $app.appendChild($outer);

    // appendChild後でないと要素を取得してEvent設定ができない
    // $app.innerHTMLで生成すると要素の取得はできるがEventの設定ができません
    const $span = $outer.querySelector('.moveBtn');
    setEvent($span,{click:updown},false);

    const $ul = document.getElementById(id);
    setEvent($ul,{
        dragover:draggingOver,
        drop:dropped,
    },false);
}

// 調味料リスト生成
const createLists = (ele,data) =>{
    const $lists = document.getElementById(ele);
    // 初期リセット
    $lists.innerHTML = '';
    // dataオブジェクトの各keyを取得してDOM利用
    const names = Object.keys(data);
    // ループ処理でのid番号振り用
    let count = 1;
    names.forEach(name=>{
        $lists.innerHTML += `
            <li id=${'data' + count} class="seasoning" name="${name}" draggable="true" style="order:${count++}">
                <span class="name">${name}</span>
            </li>
        `;
    });
    // 上記DOM操作後に一括でイベント付与
    const $seasonings = document.querySelectorAll('.seasoning');
    $seasonings.forEach(ele=>{
        setEvent(ele,{
            click:clicked,
            dragstart:dragStarted,
            dragover:draggingOver,
            drop:dropped,
            dragend:dragEnded,
        },false);
    })

}

// seasoningList へ移動 ※ 事前に$sourceにターゲットを格納
// 他関数からの利用が前提
// ※ click イベに紐づく関数呼出の場合にaddEventしたclickイベントにも伝播する
// => 元イベントでstopPropagation必須
const toSeasonings = () => {
    const $seasonings = document.getElementById('seasoningsList');
    $source.innerHTML = `
        <span class="name">${$source.getAttribute('name')}</span>
    `;
    $source.classList.remove('selected');
    $source.addEventListener('click',clicked,false);
    $seasonings.appendChild($source);
}

// selectList へ移動 ※ 事前に$sourceにターゲットを格納
// 他関数からの利用が前提
const toSelects = () => {
    const $selects = document.getElementById('selectsList');
    $source.innerHTML = `
        <span class="name">${$source.getAttribute('name')}</span>
        <input type="number" value class="setValue parts">
        <span>gは</span>
        <select class="setMeasure parts"></select>
        <span>で</span>
        <br class="break">
        <span class="result parts">0</span>
        <span>杯です</span>
        <span class="deleteBtn"></span>
    `;
    $selects.appendChild($source);
    $source.classList.add('selected');
    $source.removeEventListener('click',clicked,false);

    // イベント設定
    const setting = (ele,event) => {
        setEvent($source.querySelector(ele),event,false);
    }
    setting('.setValue',{change:saveValue});
    setting('.setMeasure',{change:saveSelected});
    setting('.deleteBtn',{click:deleteBtn,});

    // dataに登録されている計量単位を取得しselectに格納する
    // ※ (小さじ,大さじ,カップ)のいずれかの設定がない場合valueがundefinedのため個別に格納
    // 大さじの場合にデフォルトでselectedとする => 使い勝手的に小さじより利用度が高いため
    const objs = data[$source.getAttribute('name')];
    const isTbsp = (i) => {
        if(i==='大さじ'){return 'selected="selected"'}
        return "";
    }
    for(let i in objs){
        if(!objs[i]){continue}
        $source.querySelector('.setMeasure').innerHTML += `
            <option value=${i} ${isTbsp(i)}>${i}</option>
        `;
    }
}


// Event //


// clickイベント:上下移動用のトグルボタン
const updown = (e) => {
    const $updowns = document.querySelectorAll('.updown');
    $updowns.forEach(ele=>{
        ele.classList.toggle('move');
    });
}

// setValue の inputEventでvalue属性に値を保存
// => ドラッグで項目移動した際にも値を維持する
const saveValue = (e) => {
    e.target.setAttribute('value',e.target.value);
    result(e);
}

// setMeasure の changeEventでselected属性を付与
// => ドラッグで項目移動した際にデフォルト値として渡すため
const saveSelected = (e) => {
    const $options = e.target.querySelectorAll('option');
    // 一度全てのselected属性を消す
    $options.forEach(ele=>{ele.removeAttribute('selected','selected')});
    // optionの値 === selectの値 のoptionを取得しselected属性を付与
    const $selected = [...$options].find(ele=>ele.value===e.target.value);
    $selected.setAttribute('selected','selected');
    result(e);
}

// saveValue or saveSelected イベントからの派生関数
// 両項目ともに記入されていれば値を算出する
const result = (e) => {
    $source = e.target.parentNode;
    const value = $source.querySelector('.setValue').value;
    const measure = $source.querySelector('.setMeasure').value;
    if(!value || !measure){return}
    const name = $source.getAttribute('name');
    const $result = $source.querySelector('.result');
    // 記入数値 / data登録オブジェクトのselectされた計りの数値 を 四捨五入小数点第一位算出
    const result = Math.round(value/data[name][measure]*10)/10;
    $result.textContent = result;
    $source = '';
}

// deleteBtn click
// ※ stopPropagation 必須 
// => toSeasonings() で 親要素にclickイベントを再付与し伝播するため
const deleteBtn = (e) => {
    e.stopPropagation();
    $source = e.target.parentNode;
    toSeasonings();
    $source = '';
}


// click Event
// 項目をselectへ移動する
// 初回クリック時にmoveBtnにclassを付与
// => 背景色を変更しボタンへの視線を誘導する
let clickedSwitch = 1;
const clicked = (e) => {
    $source = checkList(e.target);
    toSelects();
    if(!clickedSwitch){return}
    $btns = document.querySelectorAll('.moveBtn');
    $btns.forEach(btn=>{
        btn.classList.add('induction');
    })
    clickedSwitch--;
}


// ドラッグ系イベントのターゲットを正しく補正する
// ※意図しない子要素をターゲットにしている場合に親要素に修正する
// =>現状孫要素以降に対応していない
const checkList = (ele) => {
    if(/List$/.test(ele.id)){return ele}
    if(/^data/.test(ele.id)){return ele}
    return ele.parentNode;
}


// ドラッグ開始
const dragStarted = (e)  => {
    $source = checkList(e.target);
    $source.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

// ドラッグオーバー
const draggingOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

// ドロップ
const dropped = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // ドロップ先のエリアを判定する
    // 強制的にエリアidに設定
    const areaCheck = (ele) => {
        if(/List$/.test(ele.id)){return ele.id}
        return $dropList.parentNode.id;
    }

const $dropList = checkList(e.target);
    const dragAreaId = $source.parentNode.id;
    const dropAreaId = areaCheck(e.target);

    // dragData dropData を定義する
    // exchange()で$sourceの参照に問題が出るため新規オブジェクト生成
    class ExchangeData {
        constructor(ele){
            this.html = ele.innerHTML;
            this.id = ele.id;
            this.class = ele.classList;
            this.style = ele.getAttribute('style');
            this.name = ele.getAttribute('name');
        };
    }
    const dragData = new ExchangeData($source);
    const dropData = new ExchangeData($dropList);


// 同一エリア && ドロップ先idがdataなら要素の入れ替えを行う
    if(dragAreaId===dropAreaId && /^data/.test(dropData.id)){
        // 要素とデータを元に代入する
       const exchange = (ele,tmp) => {
            ele.innerHTML = tmp.html;
            ele.id = tmp.id;
            ele.classList = tmp.class;
            ele.style = tmp.style;
            ele.setAttribute('name',tmp.name);
        }
        // 各値を入れ替え
        exchange($source,dropData);
        exchange($dropList,dragData);

        // innerHTMLでは配下のEventが引き継がれないため再設定
        const reSetEvent = (ele,event) => {
            const $drag = $source.querySelector(ele);
            const $drop = $dropList.querySelector(ele);
            if($drag && $drop){
                setEvent($drag,event,false);
                setEvent($drop,event,false);
            }
        }
        reSetEvent('.setValue',{change:saveValue});
        reSetEvent('.setMeasure',{change:saveSelected});
        reSetEvent('.deleteBtn',{click:deleteBtn});
        return;
    }
    // 別エリアにドロップした場合は移動させる
    if(dragAreaId!==dropAreaId){
        $source.classList.toggle('selected');
        if($source.classList.contains('selected')){toSelects()}
        else{toSeasonings()}
        return;
    }
}

// ドラッグイベントの結果に関わらず実施される
const dragEnded = (e) => {
    $source.classList.remove('dragging');
    $source = '';
}


// window onload
window.onload = function(){
    createOuter('up','Seasonings','seasoningsList','toBottom');
    createOuter('down','Selects','selectsList','toTop');
    createLists('seasoningsList',data);
}

// window高さor幅640pxより大きくなった時にクラスmoveを削除
// =>updownの上下スクロールを解除させる 
window.onresize = function(){
    if(window.outerHeight<=640 || window.outerWidth<=640){return}
    const $moves = document.querySelectorAll('.move');
    if($moves.length){
        $moves.forEach(ele=>{
            ele.classList.remove('move');
        })
    }
}
