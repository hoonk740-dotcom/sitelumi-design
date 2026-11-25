#!/usr/bin/env python3
"""보고서 자료 폴더(드라이브)에 큰 파일 올리기 — 디씨젼 관리자 모드 GAS 경유
   python3 drive_upload.py <관리자키> <폴더ID> <파일> [올릴 이름]   (키는 명령에서만 넘기고 파일에 저장하지 않음)"""
import sys, os, json, base64, urllib.request
URL = 'https://script.google.com/macros/s/AKfycbzcRM7Tpexe8vIsD-BTCnt72o-e69Cq4voBpXonPnlOytdi_noXjs1RqwghNKMhJSV8xA/exec'
key, parent, path = sys.argv[1:4]; name = sys.argv[4] if len(sys.argv) > 4 else os.path.basename(path)
def call(d):
    d['a'] = 'driveChunk'; d['key'] = key
    req = urllib.request.Request(URL, data=json.dumps(d).encode(), headers={'Content-Type': 'text/plain'})
    return json.load(urllib.request.urlopen(req, timeout=300))
size = os.path.getsize(path); mime = 'video/mp4' if path.endswith('.mp4') else 'image/jpeg' if path.lower().endswith(('.jpg', '.jpeg')) else 'image/png' if path.lower().endswith('.png') else 'application/octet-stream'
r = call({'op': 'start', 'name': name, 'mime': mime, 'size': size, 'parent': parent}); assert r.get('ok'), r
sess, off, CH = r['session'], 0, 8 * 1024 * 1024
with open(path, 'rb') as f:
    while off < size:
        b = f.read(CH)
        r = call({'op': 'chunk', 'session': sess, 'offset': off, 'size': size, 'data': base64.b64encode(b).decode()}); assert r.get('ok'), r
        off += len(b); print(f'{name}: {off*100//size}%', flush=True)
print(json.dumps(r.get('file', {}), ensure_ascii=False))
