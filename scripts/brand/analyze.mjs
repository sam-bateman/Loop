import sharp from "sharp";
const src = "public/brand/loop-wordmark.jpg";
const img = sharp(src);
const { width, height } = await img.metadata();
const { data } = await img.raw().toBuffer({ resolveWithObject: true });

// brightest / most saturated green = brand color
let best = null, bestScore = -1;
const hist = new Map();
for (let i = 0; i < data.length; i += 3) {
  const r = data[i], g = data[i+1], b = data[i+2];
  if (g < 120) continue;
  const score = g - Math.max(r, b);
  if (score > bestScore) { bestScore = score; best = [r,g,b]; }
  const key = `${r>>3},${g>>3},${b>>3}`;
  hist.set(key, (hist.get(key) ?? 0) + 1);
}
const top = [...hist.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3)
  .map(([k,c])=>{const [r,g,b]=k.split(",").map(n=>(+n)<<3); return {hex:`#${[r,g,b].map(v=>v.toString(16).padStart(2,"0")).join("")}`,count:c};});

// bbox + column profile of "ink" pixels
const isInk = (i) => data[i+1] > 90 && data[i+1] - Math.max(data[i], data[i+2]) > 25;
let minX=width, maxX=0, minY=height, maxY=0;
const colCount = new Array(width).fill(0);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y*width+x)*3;
    if (!isInk(i)) continue;
    colCount[x]++;
    if (x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y;
  }
}
// find vertical gaps (columns with no ink) inside the bbox -> letter segmentation
const gaps = [];
let run = null;
for (let x = minX; x <= maxX; x++) {
  if (colCount[x] === 0) { run = run ?? x; }
  else if (run !== null) { gaps.push([run, x-1]); run = null; }
}
console.log(JSON.stringify({
  width, height,
  brightestGreen: `#${best.map(v=>v.toString(16).padStart(2,"0")).join("")}`,
  topColors: top,
  bbox: { minX, minY, maxX, maxY, w: maxX-minX+1, h: maxY-minY+1 },
  gaps: gaps.filter(([a,b])=>b-a > 3),
}, null, 2));
