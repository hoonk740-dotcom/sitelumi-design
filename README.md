# sitelumi-design

사이트루미 홈페이지의 디자인 파일(공개). 블로그 테마가 jsDelivr 로 불러갑니다.

- design/sitelumi.css · design/sitelumi-main.js · design/sitelumi-ext.js
- 테마가 쓰는 주소: `https://cdn.jsdelivr.net/gh/hoonk740-dotcom/sitelumi-design@live-4/design/sitelumi.min.css` (`.min` 은 jsDelivr 가 자동으로 줄여 줌)
- 가지(branch) 구성
  - `main`: 작업 기록
  - `live-4`: 4.x 사이트가 실제로 쓰는 디자인 — 이 가지에 올리면 모든 4.x 사이트 디자인이 바뀜 (보통 12시간 안, 바로 반영하려면 아래 퍼지)
  - 5.0 이 나오면 `live-5` 를 새로 만들고, 5.0 테마가 그 가지를 씀 (4.x 사이트는 영향 없음)

## 새 디자인 내기
1. (판매자 작업 폴더) `node tools/build-theme.js` → design/ 파일 갱신 → main 에 커밋
2. 시험 사이트에서 `@main` 주소로 확인한 뒤 `live-4` 가지로 올림
3. 바로 반영: 브라우저로 아래 주소 열기
   - https://purge.jsdelivr.net/gh/hoonk740-dotcom/sitelumi-design@live-4/design/sitelumi.min.css
   - https://purge.jsdelivr.net/gh/hoonk740-dotcom/sitelumi-design@live-4/design/sitelumi-main.min.js
   - https://purge.jsdelivr.net/gh/hoonk740-dotcom/sitelumi-design@live-4/design/sitelumi-ext.min.js
4. 문제가 생기면: `live-4` 를 바로 전 커밋으로 되돌리고 다시 퍼지

## 규칙
- 4.x 안에서는 지우거나 바꾸지 말고 더하기만 (예전 엔진 버전에 묶인 사이트도 같은 파일을 씀)
- 유료 효과·시그니처 씬 코드는 여기에 넣지 않음 (판매자 Firebase 에서 등급 확인 뒤에만)
