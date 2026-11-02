'use strict';
const $=id=>document.getElementById(id);
const symbols=['7','BAR','체리','망고','종'],weights=[5,10,100,200,30],multipliers=[10,5,2,1.5,3],bets=[10,50,100,250,500];
let balance=10000,betIndex=2,count=0,wins=0,last=0,busy=false;
const state=()=>({balance,bet:bets[betIndex],count,wins,last,busy});
function render(){ $('balance').innerHTML=balance.toLocaleString()+' <small>칩</small>';$('last').innerHTML=last.toLocaleString()+' <small>칩</small>';$('bet').textContent=bets[betIndex];$('count').textContent=count;$('wins').textContent=wins;$('net').textContent=(balance>10000?'+':'')+(balance-10000).toLocaleString()+' 칩';$('spin').disabled=busy||balance<bets[betIndex];$('minus').disabled=busy||betIndex===0;$('plus').disabled=busy||betIndex===bets.length-1;$('reset').disabled=busy;}
function randomInt(max){const a=new Uint32Array(1),limit=Math.floor(4294967296/max)*max;do{crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%max;}
function pick(){let x=randomInt(1000);for(let i=0;i<weights.length;i++){if(x<weights[i])return i;x-=weights[i];}return -1;}
function outcome(){const selected=pick();if(selected>=0)return {selected,result:[selected,selected,selected]};let result;do{result=[randomInt(5),randomInt(5),randomInt(5)];}while(result.every(s=>s===result[0]));return {selected,result};}
const spriteBoxes=[[95, 326, 721, 773], [884, 466, 853, 491], [1801, 310, 805, 799], [2658, 305, 849, 811], [3516, 289, 767, 832]];
const spriteWidths=[78.0732, 92.28821, 87.03959, 91.19475, 82.88444];
function symbolMarkup(s){const [x,y,w,h]=spriteBoxes[s];return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" aria-hidden="true" focusable="false" style="width:${spriteWidths[s]}%;aspect-ratio:${w}/${h}"><image href="assets/slot-symbols-hd.png" width="4344" height="1448" /></svg>`;}
function show(i,s){const e=$('r'+i);e.innerHTML=symbolMarkup(s);e.dataset.symbol=String(s);e.setAttribute('aria-label',symbols[s]);e.setAttribute('role','img');}
document.querySelectorAll('.sprite').forEach(e=>{const s=[0,1,2,3,4].find(i=>e.classList.contains('s'+i));if(s!==undefined)e.innerHTML=symbolMarkup(s);});
async function spin(){if(busy)throw Error('릴이 회전 중입니다.');const bet=bets[betIndex];if(balance<bet)throw Error('칩이 부족합니다.');busy=true;balance-=bet;last=0;document.querySelector('.reels').classList.remove('won');$('message').textContent='어디에 멈출까요?';render();const {selected,result}=outcome();$('spin').classList.add('pulled');setTimeout(()=>$('spin').classList.remove('pulled'),560);await Promise.all(result.map((s,i)=>new Promise(resolve=>{const reel=$('r'+i).parentElement;reel.classList.add('spinning');let frame=0;const ticker=setInterval(()=>show(i,(frame++ + i)%5),90);setTimeout(()=>{clearInterval(ticker);show(i,s);reel.classList.remove('spinning');resolve();},900+i*420);})));count++;const won=selected>=0;if(won){wins++;last=bet*multipliers[result[0]];balance+=last;document.querySelector('.reels').classList.add('won');$('message').textContent=multipliers[result[0]]+'배 당첨!';}else{$('message').textContent=balance<10?'칩이 부족합니다. 처음부터 다시 시작할 수 있어요.':'이번 결과는 미당첨입니다.';}busy=false;render();return {...state(),symbols:result.map(i=>symbols[i])};}
$('spin').onclick=()=>spin().catch(e=>{$('message').textContent=e.message;});$('minus').onclick=()=>{if(!busy&&betIndex>0){betIndex--;render();}};$('plus').onclick=()=>{if(!busy&&betIndex<bets.length-1){betIndex++;render();}};$('reset').onclick=()=>{if(busy)return;balance=10000;count=wins=last=0;betIndex=2;[0,1,2].forEach(i=>show(i,0));document.querySelector('.reels').classList.remove('won');$('message').textContent='새로운 세션을 시작합니다.';render();};
[0,1,2].forEach(i=>show(i,0));
render();
if(document.modelContext?.registerTool){for(const tool of [{name:'read_slot_state',description:'현재 가상 칩, 회전 횟수 및 사용 칩을 읽습니다.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>state()},{name:'spin_virtual_slot',description:'현재 설정된 가상 칩을 사용해 한 번 회전하고 결과를 반환합니다.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{if(!input||Object.keys(input).length)throw Error('추가 입력은 지원하지 않습니다.');return spin();}}]){try{Promise.resolve(document.modelContext.registerTool(tool)).catch(()=>{});}catch{}}}

let dragStart=null,dragDistance=0,suppressClick=false;
const lever=$('spin');
function releaseLever(){dragStart=null;lever.classList.remove('dragging');lever.style.removeProperty('--pull');}
lever.addEventListener('pointerdown',e=>{if(lever.disabled||e.button!==0)return;dragStart=e.clientY;dragDistance=0;lever.classList.add('dragging');lever.setPointerCapture(e.pointerId);});
lever.addEventListener('pointermove',e=>{if(dragStart===null)return;dragDistance=Math.max(0,e.clientY-dragStart);lever.style.setProperty('--pull',Math.min(1,dragDistance/220));});
lever.addEventListener('pointerup',e=>{if(dragStart===null)return;const distance=Math.max(dragDistance,e.clientY-dragStart);releaseLever();if(distance>8){suppressClick=true;setTimeout(()=>suppressClick=false,500);if(distance>25&&!lever.disabled)spin().catch(err=>{$('message').textContent=err.message;});}});
lever.addEventListener('pointercancel',releaseLever);
lever.addEventListener('lostpointercapture',()=>{if(dragStart!==null)releaseLever();});
lever.onclick=()=>{if(!suppressClick)spin().catch(e=>{$('message').textContent=e.message;});};

const settingsButton=$('settings-button'),settingsPanel=$('settings-panel');
function closeSettings(){settingsPanel.hidden=true;settingsButton.setAttribute('aria-expanded','false');}
settingsButton.onclick=()=>{settingsPanel.hidden=!settingsPanel.hidden;settingsButton.setAttribute('aria-expanded',String(!settingsPanel.hidden));};
document.addEventListener('click',e=>{if(!settingsPanel.contains(e.target)&&!settingsButton.contains(e.target))closeSettings();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!settingsPanel.hidden){closeSettings();settingsButton.focus();}});
function updateVisibility(){const probability=$('probability-toggle').checked,chips=$('chips-toggle').checked;$('probability-panel').hidden=!probability;$('chip-panel').hidden=!chips;document.body.classList.toggle('hide-probability',!probability);document.body.classList.toggle('hide-chips',!chips);$('probability-state').textContent=probability?'ON':'OFF';$('chips-state').textContent=chips?'ON':'OFF';}
$('probability-toggle').onchange=updateVisibility;$('chips-toggle').onchange=updateVisibility;updateVisibility();
