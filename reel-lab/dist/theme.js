'use strict';
/*
 * 테마 엔진 (app.js 뒤에 로드). app.js / style.css 는 수정하지 않고,
 * 전역 함수 show / symbolMarkup / ensureAudio / sound* 만 덮어써서 시청각을 바꾼다.
 * 확률·배당·베팅 등 로직 변수는 읽지도 쓰지도 않는다(심볼 인덱스 s 는 그대로 사용).
 * 테마 데이터는 themes.js 의 window.REEL_THEMES 에 정의한다.
 */
(function(){
const themes=Array.isArray(window.REEL_THEMES)?window.REEL_THEMES:[];
if(!themes.length)return;

const orig={show,symbolMarkup,ensureAudio,soundLever,soundTick,soundStop,soundWin};
const root=document.documentElement;
let cur=null,setVars=[];

const imgFor=(reel,s)=>{const r=cur&&cur.reels&&cur.reels[reel];return r&&r[s];};
const imgTag=u=>`<img class="theme-img" src="${u}" alt="" draggable="false">`;
const nameOf=s=>(cur&&cur.names&&cur.names[s])||symbols[s];

/* ---------- 이미지: 릴마다 다른 이미지 ---------- */
window.show=function(i,s){
  const u=imgFor(i,s);
  if(!u)return orig.show(i,s);
  const e=document.getElementById('r'+i);
  e.innerHTML=imgTag(u);
  e.dataset.symbol=String(s);
  e.setAttribute('aria-label',nameOf(s));
  e.setAttribute('role','img');
};
// 관리자 표 등 릴 위치가 없는 곳은 대표로 1번 릴 이미지를 쓴다.
window.symbolMarkup=function(s){const u=imgFor(0,s);return u?imgTag(u):orig.symbolMarkup(s);};

function refreshPayout(){
  document.querySelectorAll('.payout dt').forEach(dt=>{
    dt.querySelectorAll('.sprite').forEach((e,k)=>{
      const s=[0,1,2,3,4].find(n=>e.classList.contains('s'+n));
      if(s===undefined)return;
      const u=imgFor(k,s);
      e.innerHTML=u?imgTag(u):orig.symbolMarkup(s);
    });
  });
}
function refreshReels(){[0,1,2].forEach(i=>show(i,Number(document.getElementById('r'+i).dataset.symbol)||0));}

/* ---------- 소리: 파일이 있으면 재생, 없으면 기존 합성음 ---------- */
const raw=new Map(),dec=new Map(),decoding=new Set();
function soundUrls(t){
  const out=[],s=t&&t.sounds||{};
  Object.values(s).forEach(v=>(Array.isArray(v)?v:[v]).forEach(u=>u&&out.push(u)));
  return out;
}
function prefetch(t){
  soundUrls(t).forEach(u=>{if(!raw.has(u))raw.set(u,fetch(u).then(r=>r.ok?r.arrayBuffer():null).catch(()=>null));});
}
function decodeAll(){
  if(!actx)return;
  raw.forEach((p,u)=>{
    if(dec.has(u)||decoding.has(u))return;
    decoding.add(u);
    p.then(ab=>ab&&actx.decodeAudioData(ab.slice(0))).then(b=>{if(b)dec.set(u,b);}).catch(()=>{}).finally(()=>decoding.delete(u));
  });
}
function snd(key,i){
  const s=cur&&cur.sounds&&cur.sounds[key];
  return Array.isArray(s)?(s[i]!==undefined?s[i]:s[s.length-1]):s;
}
function play(u,dest){
  const c=audioReady(),b=u&&dec.get(u);
  if(!c||!b)return false;
  const src=c.createBufferSource();
  src.buffer=b;src.connect(dest||master);src.start();
  return true;
}
window.ensureAudio=function(){const c=orig.ensureAudio();if(c)decodeAll();return c;};
window.soundLever=function(){if(!play(snd('lever')))orig.soundLever();};
window.soundTick=function(){if(!play(snd('tick')))orig.soundTick();};
window.soundStop=function(i){if(!play(snd('stop',i)))orig.soundStop(i);};
window.soundWin=function(tier){
  const u=snd('win',tier-1),c=audioReady();
  if(u&&c&&dec.has(u)){stopWinSound();winBus=c.createGain();winBus.connect(master);play(u,winBus);return;}
  orig.soundWin(tier);
};

/* ---------- 테마 적용 ---------- */
function preloadImages(t){
  const urls=[t.background];
  (t.reels||[]).forEach(r=>(r||[]).forEach(u=>urls.push(u)));
  return Promise.all(urls.filter(Boolean).map(u=>new Promise(res=>{const im=new Image();im.onload=im.onerror=res;im.src=u;})));
}
async function applyTheme(id){
  const t=themes.find(x=>x.id===id)||null;
  if(t){await preloadImages(t);prefetch(t);}
  cur=t;
  setVars.forEach(k=>root.style.removeProperty(k));setVars=[];
  if(t){
    root.dataset.theme=t.id;
    Object.entries(t.vars||{}).forEach(([k,v])=>{root.style.setProperty(k,v);setVars.push(k);});
    if(t.background){root.style.setProperty('--theme-bg',`url("${t.background}")`);setVars.push('--theme-bg');}
  }else delete root.dataset.theme;
  root.classList.toggle('has-theme-bg',!!(t&&t.background));
  if(t&&document.getElementById('sound-toggle').checked){ensureAudio();}
  refreshReels();refreshPayout();
}

/* ---------- 선택 UI (설정 패널에 추가, 저장 안 함) ---------- */
(function buildUi(){
  const panel=document.getElementById('settings-panel'),admin=document.getElementById('admin-button');
  if(!panel)return;
  const label=document.createElement('label');
  label.append('테마 ');
  const wrap=document.createElement('span'),sel=document.createElement('select');
  sel.id='theme-select';sel.setAttribute('aria-label','테마 선택');
  [{id:'',name:'기본'},...themes].forEach(t=>{const o=document.createElement('option');o.value=t.id;o.textContent=t.name;sel.appendChild(o);});
  sel.onchange=()=>applyTheme(sel.value);
  wrap.appendChild(sel);label.appendChild(wrap);
  panel.insertBefore(label,admin);
})();
})();
