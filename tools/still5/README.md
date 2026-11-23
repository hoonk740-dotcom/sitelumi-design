# 스틸 5컷 광고 엔진

광고주가 준 사진을 주인공으로 5컷(컷당 약 3초, 총 15초) 광고를 세로(1080×1920)와 가로(1920×1080) 두 벌로 만듭니다.

```
cd tools/still5 && npm i            # 글꼴 (Pretendard·Noto Serif KR·고운바탕·검은고딕·IBM Plex Sans KR·나눔명조)
python3 -I analyze.py <작업폴더>/photos <작업폴더>/photos.json
node render.js <작업폴더> [--still] [--only v|h] [--seed 숫자]
python3 sheet.py <작업폴더>         # 10장 한눈에 보기
```

- 작업폴더: `brief.json`, `photos/`(광고주 사진·로고)
- 결과: `out/v_1~5.png`, `out/h_1~5.png`, `out/ad_v_15s.mp4`, `out/ad_h_15s.mp4`(H.264, 무음 오디오 트랙 포함), `out/plan.json`
- 배치 11종(cover·band·split·editorial·spotlight·poster·mat·collage·board·pricehero·statement) + 위치 3종(placeMap·placePhoto·placeType). **마지막 컷은 항상 위치**입니다(주소·찾아오는 길·영업시간·전화·지도 QR).
- 톤 7가지에 따라 글꼴 8종·모서리·장식·강조 방식·사진 보정·전환이 바뀝니다. 같은 폴더의 상위에 있는 `still5-history.json`(또는 `--history`)과 비교해 **이전 광고와 가장 덜 닮은 조합**을 고릅니다. `--seed`로 직접 지정, `--dry`는 기록하지 않음.
- 글자 움직임: 제목 줄별 가림막 올라옴, `[대괄호]` 단어 강조(형광펜·밑줄·색), 가격 숫자 올라감, 배지 튀어나옴, 위치 핀 떨어짐·파동.
- 모니터 안전 영역: 가장자리 6% 안쪽에만 글자. 넘치거나 바닥글과 겹치면 글자를 자동으로 줄이고, 결과를 `plan.json`의 `check`에 남깁니다.
- 필요: Node 18+, Playwright(Chrome), ffmpeg, Python 3 + numpy + Pillow
