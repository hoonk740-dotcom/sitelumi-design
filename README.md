# sitelumi-design

사이트루미 홈페이지의 디자인 파일(공개). 블로그 테마가 jsDelivr 로 불러갑니다.

- design/sitelumi.css · design/sitelumi-main.js · design/sitelumi-ext.js
- 테마가 쓰는 주소: `https://cdn.jsdelivr.net/gh/hoonk740-dotcom/sitelumi-design@main/design/sitelumi.min.css` (`.min` 은 jsDelivr 가 자동으로 줄여 줌)
- 가지(branch) 구성
  - `main`: 4.x 사이트가 실제로 쓰는 디자인 — main 에 올리면 모든 4.x 사이트 디자인이 바뀜 (바로 반영하려면 아래 퍼지)
  - 시험은 `dev` 가지에 먼저 올려 `@dev` 주소로 확인한 뒤 main 에 합침
  - (예전 `live-4` 가지는 jsDelivr 가 가지 주소를 오래 붙잡아 두는 문제가 있어 2026-11 부터 쓰지 않음)
  - 5.0 이 나오면 테마가 파일 이름에 5 를 붙인 새 파일(sitelumi5.css 등)을 쓰게 해서 4.x 사이트는 영향 없음

## 새 디자인 내기
1. (판매자 작업 폴더) `node tools/build-theme.js` → design/ 파일 갱신 → `dev` 가지에 커밋
2. 시험 사이트에서 `@dev` 주소로 확인한 뒤 main 에 합침
3. 바로 반영: 브라우저로 아래 주소 열기
   - https://purge.jsdelivr.net/gh/hoonk740-dotcom/sitelumi-design@main/design/sitelumi.min.css
   - https://purge.jsdelivr.net/gh/hoonk740-dotcom/sitelumi-design@main/design/sitelumi-main.min.js
   - https://purge.jsdelivr.net/gh/hoonk740-dotcom/sitelumi-design@main/design/sitelumi-ext.min.js
   - (효과·씬) sitelumi-fx.min.js · sitelumi-scenes.min.js 도 같은 방식
4. 문제가 생기면: main 을 바로 전 커밋으로 되돌리고(git revert) 다시 퍼지

## 규칙
- 4.x 안에서는 지우거나 바꾸지 말고 더하기만 (예전 엔진 버전에 묶인 사이트도 같은 파일을 씀)
- 효과·시그니처 씬 실행 코드는 공개되어도 됨 — 어떤 효과·씬이 켜지는지는 구매자 엔진이 서명된 상품 확인서를 보고 페이지에 표시(data-fx-*)할 때만 정해짐

## engine/ — 구매자 엔진 자동 업그레이드 묶음
- `manifest.json` + `bundle-<버전>.json` (판매자 작업 폴더에서 `node tools/build-engine.js` 로 만듦)
- 구매자 GAS(Update.gs)가 매일 manifest 를 보고 새 버전이면 묶음을 받아 SHA-256 확인 뒤 교체
- 올린 뒤 퍼지: `https://purge.jsdelivr.net/gh/hoonk740-dotcom/sitelumi-design@main/engine/manifest.json`
- 같은 버전 번호로 다시 만들지 않기 (예전 묶음이 캐시에 남아 SHA 불일치)
