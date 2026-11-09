'use strict';
/*
 * 테마 데이터. 여기만 수정/추가하면 된다.
 *  - reels[릴번호 0~2][심볼번호 0~4] = 이미지 경로. 심볼 번호는 app.js 와 동일:
 *      0=7, 1=BAR, 2=체리, 3=망고, 4=종  (확률·배당은 이 번호로만 결정됨)
 *    같은 심볼 번호라도 릴마다 다른 이미지를 지정할 수 있다.
 *  - background: 배경 이미지(선택)
 *  - vars: CSS 변수(선택). --t-frame, --t-reel, --t-frame-edge 등
 *  - sounds: 효과음 파일(선택, 없으면 기존 합성음). stop/win 은 배열도 가능
 *      { lever, tick, stop:[릴0,릴1,릴2] 또는 하나, win:[1단계,2단계,3단계,4단계] }
 *  - names: 접근성 이름(선택, 심볼 5개)
 * 아래 'sample' 은 동작 확인용 자리표시 테마이다. 실제 캐릭터 이미지를 넣을 때 교체/삭제한다.
 */
(function(){
const ph=(bg,txt)=>'data:image/svg+xml,'+encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="${bg}"/><text x="50" y="62" font-size="34" font-family="Arial" text-anchor="middle" fill="#fff">${txt}</text></svg>`);
const reel=(bg,tag)=>[0,1,2,3,4].map(s=>ph(bg,tag+s));
window.REEL_THEMES=[
  {
    id:'sample',
    name:'샘플(자리표시)',
    reels:[reel('#c0392b','A'),reel('#27ae60','B'),reel('#2980b9','C')],
    vars:{'--t-frame':'linear-gradient(110deg,#2c3e50,#8aa4bd 30%,#34495e 70%,#1b2631)','--t-frame-edge':'#8aa4bd','--t-reel':'linear-gradient(90deg,#d7dde3,#f7f9fb 48%,#cfd6dd)'}
  }
];
})();
