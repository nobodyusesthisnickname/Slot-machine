# REEL LAB — Claude 인수인계 패키지

2026-10-14 최종 배포(v19)를 Claude에서 수정한 로컬 소스입니다(미배포). 수정 전 v19 원본은 상위 폴더의 `backup-v19/dist/`에 있고, 변경 내용은 `CLAUDE_HANDOFF.md`의 "v19 이후 로컬 변경"에 정리돼 있습니다.

## 시작
1. 이 ZIP을 전부 압축 해제합니다.
2. Claude에 `CLAUDE_HANDOFF.md`와 `CONTINUE_PROMPT.txt`를 먼저 전달합니다.
3. 프로젝트 전체 폴더를 Claude가 접근할 수 있는 작업공간에 놓습니다.
4. 웹 화면을 실행할 때는 VS Code에서 `dist/index.html`을 Live Server로 열거나, 아래 로컬 서버를 사용합니다.

```sh
cd dist
python -m http.server 8000
```

http://localhost:8000 에 접속합니다. (Python이 없으면 `npx serve dist` 등 다른 정적 서버를 쓰세요.) 기본 HTML 직접 열기도 가능하지만 SVG 외부 이미지 등은 로컬 HTTP 서버에서 확인하는 것이 좋습니다.

별도 npm 설치·빌드가 필요 없는 정적 HTML/CSS/JavaScript 사이트입니다.

## 파일
- `dist/index.html`: 화면 구조와 확률/배당표
- `dist/style.css`: 레이아웃, 반응형, 심벌 및 레버 표현
- `dist/app.js`: 난수 추첨, 칩, 회전, SVG 심벌 표시, 설정
- `dist/assets/`: 현재 이미지와 과거 버전 보관본
- `CLAUDE_HANDOFF.md`: 결정 사항, 구현 상세, 미확인 사항
- `CONTINUE_PROMPT.txt`: Claude에 붙여넣을 시작 메시지
- `FILE_SHA256.json`: 소스·이미지 무결성 체크 값
- `.openai/hosting.json`: 기존 Sites 프로젝트 식별·배포 설정. 인증 정보는 포함하지 않습니다.

배포 주소: https://reel-lab-simulator.a01064056437.chatgpt.site

로컬 파일을 수정해도 위 주소가 자동 갱신되지 않습니다. 별도 배포가 필요합니다.
