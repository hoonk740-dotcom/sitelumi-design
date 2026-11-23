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
- 배치 7종(cover·band·split·poster·collage·board·statement) 중 광고주 이름·업종·사진 수·역할에 따라 다르게 고르고, 톤에 따라 글꼴·모서리·장식·전환이 바뀝니다. `--seed`로 다른 배치를 뽑을 수 있습니다.
- 필요: Node 18+, Playwright(Chrome), ffmpeg, Python 3 + numpy + Pillow
