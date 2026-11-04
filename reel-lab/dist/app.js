'use strict';
const $=id=>document.getElementById(id);
const symbols=['7','BAR','체리','망고','종'],weights=[5,10,150,200,30],multipliers=[10,5,2,1,3],bets=[10,50,100,250,500,1000],defaultBetIndex=bets.length-1;
const chipStep=1000;
let balance=10000,betIndex=defaultBetIndex,count=0,wins=0,last=0,profit=0,busy=false;
const state=()=>({balance,bet:bets[betIndex],count,wins,last,busy});
function render(){ $('balance').innerHTML=balance.toLocaleString()+' <small>칩</small>';$('last').innerHTML=last.toLocaleString()+' <small>칩</small>';$('bet').textContent=bets[betIndex];$('count').textContent=count;$('wins').textContent=wins;$('net').textContent=(profit>0?'+':'')+profit.toLocaleString()+' 칩';$('spin').disabled=busy||balance<bets[betIndex];$('minus').disabled=busy||betIndex===0;$('plus').disabled=busy||betIndex===bets.length-1;$('reset').disabled=busy;$('chip-minus').disabled=busy||balance<chipStep;$('chip-plus').disabled=busy;}
function randomInt(max){const a=new Uint32Array(1),limit=Math.floor(4294967296/max)*max;do{crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%max;}
function pick(){let x=randomInt(1000);for(let i=0;i<weights.length;i++){if(x<weights[i])return i;x-=weights[i];}return -1;}
function outcome(){const selected=pick();if(selected>=0)return {selected,result:[selected,selected,selected]};let result;do{result=[randomInt(5),randomInt(5),randomInt(5)];}while(result.every(s=>s===result[0]));return {selected,result};}
const spriteBoxes=[[95, 326, 721, 773], [884, 466, 853, 491], [1801, 310, 805, 799], [2658, 305, 849, 811], [3516, 289, 767, 832]];
const spriteWidths=[75.0732, 89.28821, 84.03959, 88.19475, 79.88444];
const spriteNudge=[4.22, 0.06, -2.19, 1.11, -0.43];
const spriteTone=['none','none','brightness(.92) saturate(.88)','brightness(.92) saturate(.88)','none'];
function symbolMarkup(s){const [x,y,w,h]=spriteBoxes[s];return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" aria-hidden="true" focusable="false" style="width:${spriteWidths[s]}%;aspect-ratio:${w}/${h};--nudge:${spriteNudge[s]}%;filter:${spriteTone[s]}"><image href="assets/slot-symbols-hd.png" width="4344" height="1448" /></svg>`;}
function show(i,s){const e=$('r'+i);e.innerHTML=symbolMarkup(s);e.dataset.symbol=String(s);e.setAttribute('aria-label',symbols[s]);e.setAttribute('role','img');}
document.querySelectorAll('.sprite').forEach(e=>{const s=[0,1,2,3,4].find(i=>e.classList.contains('s'+i));if(s!==undefined)e.innerHTML=symbolMarkup(s);});
const stopTimes=[2000,2500,4000];
async function spin(){if(busy)throw Error('릴이 회전 중입니다.');const bet=bets[betIndex];if(balance<bet)throw Error('칩이 부족합니다.');busy=true;balance-=bet;profit+=bet;last=0;document.querySelector('.reels').classList.remove('won');clearWinFx();ensureAudio();soundLever();$('message').textContent='어디에 멈출까요?';render();const {selected,result}=outcome();const mult=multipliers[result[0]];$('spin').classList.add('pulled');setTimeout(()=>$('spin').classList.remove('pulled'),560);const tickTimer=setInterval(soundTick,90);await Promise.all(result.map((s,i)=>new Promise(resolve=>{const reel=$('r'+i).parentElement;reel.classList.add('spinning');let frame=0;const ticker=setInterval(()=>show(i,(frame++ + i)%5),90);setTimeout(()=>{clearInterval(ticker);show(i,s);soundStop(i);reel.classList.remove('spinning');resolve();},stopTimes[i]);})));clearInterval(tickTimer);count++;const won=selected>=0;if(won){wins++;last=bet*mult;balance+=last;profit-=last;document.querySelector('.reels').classList.add('won');$('message').textContent=mult+'배 당첨!';winFx(mult);}else{$('message').textContent=balance<10?'칩이 부족합니다. 처음부터 다시 시작할 수 있어요.':'이번 결과는 미당첨입니다.';}busy=false;render();return {...state(),symbols:result.map(i=>symbols[i])};}
$('spin').onclick=()=>spin().catch(e=>{$('message').textContent=e.message;});$('minus').onclick=()=>{if(!busy&&betIndex>0){betIndex--;render();}};$('plus').onclick=()=>{if(!busy&&betIndex<bets.length-1){betIndex++;render();}};$('reset').onclick=()=>{if(busy)return;clearWinFx();[0,1,2].forEach(i=>show(i,0));document.querySelector('.reels').classList.remove('won');$('message').textContent='릴을 7로 되돌렸습니다.';render();};$('chip-minus').onclick=()=>{if(!busy&&balance>=chipStep){balance-=chipStep;render();}};$('chip-plus').onclick=()=>{if(!busy){balance+=chipStep;render();}};
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

const adminPassword='admin1220',payoutOrder=[3,2,4,1,0];
const fmt=n=>String(+n.toFixed(2));
function stats(w=weights,m=multipliers){const win=w.reduce((a,b)=>a+b,0),rtp=w.reduce((a,x,i)=>a+x*m[i],0);return {win:win/10,rtp:rtp/10,lose:(1000-win)/10};}
function updateInfo(){document.querySelectorAll('[data-prob]').forEach(e=>e.textContent=fmt(weights[e.dataset.prob]/10)+'%');document.querySelectorAll('[data-mult-label]').forEach(e=>e.textContent=fmt(multipliers[e.dataset.multLabel])+'배');document.querySelectorAll('[data-pay]').forEach(e=>e.textContent='×'+fmt(multipliers[e.dataset.pay]));const s=stats();$('lose-prob').textContent=fmt(s.lose)+'%';$('rtp-text').textContent='RTP '+fmt(s.rtp)+'% · 당첨 확률 '+fmt(s.win)+'%';}
updateInfo();

const overlay=$('modal-overlay'),loginForm=$('admin-login'),adminPanel=$('admin-panel');
function openModal(which){overlay.hidden=false;loginForm.hidden=which!=='login';adminPanel.hidden=which!=='admin';}
function closeModal(){overlay.hidden=true;loginForm.hidden=true;adminPanel.hidden=true;$('admin-password').value='';$('admin-login-error').textContent='';settingsButton.focus();}
$('admin-button').onclick=()=>{closeSettings();$('admin-password').value='';$('admin-login-error').textContent='';openModal('login');$('admin-password').focus();};
$('admin-login-cancel').onclick=closeModal;$('admin-close').onclick=closeModal;
overlay.addEventListener('mousedown',e=>{if(e.target===overlay&&!loginForm.hidden)closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)closeModal();});
overlay.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const box=loginForm.hidden?adminPanel:loginForm,f=[...box.querySelectorAll('input,button')].filter(x=>!x.disabled),a=document.activeElement;if(!f.length)return;if(e.shiftKey&&a===f[0]){e.preventDefault();f[f.length-1].focus();}else if(!e.shiftKey&&a===f[f.length-1]){e.preventDefault();f[0].focus();}});
loginForm.onsubmit=e=>{e.preventDefault();if($('admin-password').value===adminPassword){$('admin-password').value='';$('admin-login-error').textContent='';buildAdminTable();openModal('admin');$('admin-rows').querySelector('input').focus();}else{$('admin-login-error').textContent='비밀번호가 맞지 않습니다.';$('admin-password').value='';$('admin-password').focus();}};

function buildAdminTable(){$('admin-rows').innerHTML=payoutOrder.map(s=>`<tr data-s="${s}"><td><span class="admin-sym">${symbolMarkup(s)}</span><span>${symbols[s]}</span></td><td><input type="number" data-kind="m" step="0.1" min="0.1" max="1000" inputmode="decimal" aria-label="${symbols[s]} 배당(배)" value="${fmt(multipliers[s])}"></td><td><input type="number" data-kind="p" step="0.1" min="0" max="100" inputmode="decimal" aria-label="${symbols[s]} 확률(%)" value="${fmt(weights[s]/10)}"></td></tr>`).join('');$('admin-status').textContent='';refreshAdmin();}
function readAdmin(){const vals=[];let err='';const tenth=x=>Math.abs(x*10-Math.round(x*10))<1e-6;$('admin-rows').querySelectorAll('tr').forEach(tr=>{const s=+tr.dataset.s,mi=tr.querySelector('[data-kind=m]').value.trim(),pi=tr.querySelector('[data-kind=p]').value.trim(),m=mi===''?NaN:Number(mi),p=pi===''?NaN:Number(pi);vals[s]={m,p};if(err)return;if(!Number.isFinite(m)||!Number.isFinite(p))err=symbols[s]+': 숫자를 입력하세요.';else if(m<=0||m>1000||!tenth(m))err=symbols[s]+': 배당은 0.1~1000배(0.1 단위)여야 합니다.';else if(p<0||p>100||!tenth(p))err=symbols[s]+': 확률은 0~100%(0.1 단위)여야 합니다.';});if(!err){const total=vals.reduce((a,v)=>a+Math.round(v.p*10),0);if(total>1000)err='확률 합계가 100%를 넘습니다. (현재 '+fmt(total/10)+'%)';}return {vals,err};}
function refreshAdmin(){const {vals,err}=readAdmin();$('admin-error').textContent=err;$('admin-status').textContent='';$('admin-apply').disabled=!!err;if(err){$('admin-lose').textContent='-';$('admin-summary').textContent='';return;}const s=stats(vals.map(v=>Math.round(v.p*10)),vals.map(v=>v.m));$('admin-lose').textContent=fmt(s.lose);$('admin-summary').textContent='RTP '+fmt(s.rtp)+'% · 당첨 확률 '+fmt(s.win)+'%';}
function applyAdmin(){const {vals,err}=readAdmin();if(err){$('admin-error').textContent=err;return;}vals.forEach((v,s)=>{weights[s]=Math.round(v.p*10);multipliers[s]=v.m;});updateInfo();const s=stats();$('admin-error').textContent='';$('admin-status').textContent='적용되었습니다. RTP '+fmt(s.rtp)+'% · 당첨 확률 '+fmt(s.win)+'%';$('message').textContent='배당과 확률을 적용했습니다.';}
$('admin-rows').addEventListener('input',refreshAdmin);
$('admin-rows').addEventListener('keydown',e=>{if(e.key==='Enter'&&!$('admin-apply').disabled){e.preventDefault();applyAdmin();}});
$('admin-apply').onclick=applyAdmin;

// 소리(Web Audio 합성)와 당첨 효과. 소리는 첫 레버 조작 이후에만 재생된다.
const volume=0.35;
let actx=null,master=null,winBus=null,noiseBuf=null;
function ensureAudio(){if(!$('sound-toggle').checked)return null;try{if(!actx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;actx=new AC();master=actx.createGain();master.gain.value=volume;master.connect(actx.destination);}if(actx.state==='suspended')actx.resume();}catch{return null;}return actx;}
const audioReady=()=>($('sound-toggle').checked&&actx&&actx.state==='running')?actx:null;
function tone(f,t0,dur,o={}){const c=audioReady();if(!c)return;const osc=c.createOscillator(),g=c.createGain(),t=c.currentTime+t0;osc.type=o.type||'sine';osc.frequency.setValueAtTime(f,t);if(o.slideTo)osc.frequency.exponentialRampToValueAtTime(o.slideTo,t+dur);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(o.gain||.2,t+.008);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);osc.connect(g);g.connect(o.bus||master);osc.start(t);osc.stop(t+dur+.02);}
function noise(t0,dur,gain,freq,bus){const c=audioReady();if(!c)return;if(!noiseBuf){noiseBuf=c.createBuffer(1,c.sampleRate*.5,c.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}const src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime+t0;src.buffer=noiseBuf;f.type='bandpass';f.frequency.value=freq;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(0.0001,t+Math.min(dur,.45));src.connect(f);f.connect(g);g.connect(bus||master);src.start(t);src.stop(t+Math.min(dur,.45)+.02);}
function soundLever(){tone(110,0,.18,{type:'triangle',gain:.3,slideTo:55});noise(0,.08,.25,1800);}
function soundTick(){tone(1400,0,.02,{type:'square',gain:.025});}
function soundStop(i){tone(180+i*30,0,.12,{gain:.35,slideTo:90});noise(0,.05,.2,900);}
function stopWinSound(){if(winBus&&actx){const b=winBus,t=actx.currentTime;try{b.gain.cancelScheduledValues(t);b.gain.setValueAtTime(b.gain.value,t);b.gain.linearRampToValueAtTime(0,t+.06);}catch{}}winBus=null;}
function soundWin(tier){const c=audioReady();if(!c)return;stopWinSound();winBus=c.createGain();winBus.connect(master);const bus=winBus,mel=(notes,step,len)=>notes.forEach((f,i)=>{tone(f,i*step,len,{type:'triangle',gain:.22,bus});tone(f*2,i*step,len*.6,{gain:.06,bus});}),C5=523.25,E5=659.25,G5=783.99,C6=1046.5,E6=1318.5,G6=1567.98;
if(tier===1)mel([E5,G5],.12,.3);
else if(tier===2)mel([C5,E5,G5,C6],.11,.32);
else if(tier===3){mel([C5,E5,G5,C6,E6,G6],.1,.34);noise(.7,.4,.12,6000,bus);}
else{mel([C5,E5,G5,C6,E5,G5,C6,E6],.13,.36);[C6,E6,G6].forEach(f=>tone(f,1.2,.9,{type:'triangle',gain:.2,bus}));for(let i=0;i<8;i++)tone(2093+Math.random()*1500,1.2+i*.18,.14,{gain:.08,bus});noise(1.2,.45,.14,7000,bus);}}

const winTiers=[2,5,10],fxDuration=[0,1800,2200,2800,3800],fxParticles=[0,0,12,28,60];
const winTier=m=>1+winTiers.filter(t=>m>=t).length;
const reduceMotion=()=>!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
let fxTimer=null;
function clearWinFx(keepWon){clearTimeout(fxTimer);fxTimer=null;const reels=document.querySelector('.reels');reels.classList.remove('win-t1','win-t2','win-t3','win-t4');if(!keepWon)reels.classList.remove('won');document.querySelector('.machine').classList.remove('win-shake');document.querySelector('.machine-wrap').classList.remove('fx-focus');$('win-dim').classList.remove('on');$('win-text').classList.remove('on');$('win-text').textContent='';$('fx-layer').innerHTML='';stopWinSound();}
function spawnParticles(n,tier){const layer=$('fx-layer'),r=document.querySelector('.reels').getBoundingClientRect(),colors=tier===4?['#ffd76a','#fff3c4','#ff5a4f','#ffb347']:['#ffd76a','#fff3c4','#ffb347'];for(let i=0;i<n;i++){const p=document.createElement('span'),ang=Math.random()*Math.PI*2,dist=60+Math.random()*tier*40;p.className='spark';p.style.cssText=`left:${r.left+Math.random()*r.width}px;top:${r.top+r.height*(.25+Math.random()*.6)}px;--dx:${Math.cos(ang)*dist}px;--dy:${Math.sin(ang)*dist-40-Math.random()*60}px;--rot:${Math.random()*360}deg;--delay:${Math.random()*.5}s;--s:${.6+Math.random()*.9};background:${colors[i%colors.length]}`;p.addEventListener('animationend',()=>p.remove());layer.appendChild(p);}}
function winFx(mult){const tier=winTier(mult);soundWin(tier);if(!$('effects-toggle').checked)return;const reels=document.querySelector('.reels'),r=reels.getBoundingClientRect(),dim=$('win-dim'),wt=$('win-text'),dur=fxDuration[tier]+'ms';reels.classList.add('win-t'+tier);document.querySelector('.machine-wrap').classList.add('fx-focus');dim.dataset.tier=tier;dim.style.setProperty('--fx-dur',dur);dim.style.setProperty('--cx',(r.left+r.width/2)+'px');dim.style.setProperty('--cy',(r.top+r.height/2)+'px');dim.classList.add('on');wt.textContent='';const label=document.createElement('span');label.textContent=fmt(mult)+'배 당첨!';wt.appendChild(label);wt.dataset.tier=tier;wt.style.setProperty('--fx-dur',dur);wt.classList.add('on');if(!reduceMotion()){if(tier===4)document.querySelector('.machine').classList.add('win-shake');spawnParticles(fxParticles[tier],tier);}fxTimer=setTimeout(()=>clearWinFx(true),fxDuration[tier]);}
function updateOptions(){const s=$('sound-toggle').checked,e=$('effects-toggle').checked;$('sound-state').textContent=s?'ON':'OFF';$('effects-state').textContent=e?'ON':'OFF';if(!s)stopWinSound();if(!e)clearWinFx(true);}
$('sound-toggle').onchange=updateOptions;$('effects-toggle').onchange=updateOptions;updateOptions();
