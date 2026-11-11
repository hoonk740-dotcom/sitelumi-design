# sitelumi-design

사이트루미 홈페이지의 디자인 파일(공개). 블로그 테마가 jsDelivr 로 불러갑니다.

- design/sitelumi.css · design/sitelumi-main.js · design/sitelumi-ext.js
- 테마 주소: `https://cdn.jsdelivr.net/gh/hoonk740-dotcom/sitelumi-design@4/design/sitelumi.min.css` (`.min` 은 jsDelivr 가 자동으로 줄여 줌)
- `@4` = 4.x 태그 중 가장 최신 → 태그를 새로 달면 모든 사이트 디자인이 바뀜 (보통 12시간 안, 바로 반영하려면 아래 퍼지)

## 새 디자인 내기
1. (판매자 작업 폴더) `node tools/build-theme.js` → design/ 파일 갱신
2. 이 저장소에 커밋 → 태그: `git tag v4.0.1 && git push --tags`
3. 바로 반영: 브라우저로 아래 주소 열기
   - https://purge.jsdelivr.net/gh/hoonk740-dotcom/sitelumi-design@4/design/sitelumi.min.css
   - https://purge.jsdelivr.net/gh/hoonk740-dotcom/sitelumi-design@4/design/sitelumi-main.min.js
   - https://purge.jsdelivr.net/gh/hoonk740-dotcom/sitelumi-design@4/design/sitelumi-ext.min.js
4. 문제가 생기면: 이전 커밋으로 되돌린 새 태그(v4.0.2)를 달고 다시 퍼지

## 규칙
- 4.x 안에서는 지우거나 바꾸지 말고 더하기만 (예전 엔진 버전에 묶인 사이트도 같은 파일을 씀)
- 유료 효과·시그니처 씬 코드는 여기에 넣지 않음 (판매자 Firebase 에서 등급 확인 뒤에만)
