import sys
from PIL import Image
d=sys.argv[1]
v=[Image.open(f'{d}/out/v_{i}.png').resize((270,480)) for i in range(1,6)]
h=[Image.open(f'{d}/out/h_{i}.png').resize((480,270)) for i in range(1,6)]
s=Image.new('RGB',(1464,480+8+278*2),'white')
for i,im in enumerate(v): s.paste(im,(i*278,0))
for i,im in enumerate(h): s.paste(im,((i%3)*488 if i<3 else (i-3)*488,488+(i//3)*278))
s.save(f'{d}/sheet.png')
