// USGS Hydrograph Widget for Scriptable
// ---------------------------------------
// Home screen widget Parameter field = USGS site number (e.g. 08074500).
// Defaults to gauge height (00065), last 48 hours.

// ---- CONFIG ----
const SITE = (args.widgetParameter || "08158000").trim(); // fallback: Colorado Rv at Austin, TX
const PARAM = "00065";   // 00065 = gauge height (ft), 00060 = discharge (cfs)
const HOURS = 168;        // lookback window
const LINE_COLOR = new Color("#3b82f6");
const FILL_COLOR = new Color("#3b82f6", 0.18);
const BG_COLOR = new Color("#0f172a");
const TEXT_COLOR = new Color("#e2e8f0");
const MUTED_COLOR = new Color("#94a3b8");

// ---- FETCH ----
const startDT = new Date(Date.now() - HOURS * 3600 * 1000).toISOString();
const url =
  `https://waterservices.usgs.gov/nwis/iv/?format=json` +
  `&sites=${SITE}&parameterCd=${PARAM}` +
  `&startDT=${encodeURIComponent(startDT)}`;

let data;
try {
  data = await new Request(url).loadJSON();
} catch (e) {
  return await renderError("Network error");
}

const ts = data?.value?.timeSeries?.[0];
if (!ts) return await renderError(`No data for ${SITE}`);

const raw = ts.values?.[0]?.value || [];
const points = raw
  .map((p) => ({ t: new Date(p.dateTime).getTime(), v: parseFloat(p.value) }))
  .filter((p) => !isNaN(p.v) && p.v > -999999); // USGS uses -999999 for "no value"

if (points.length < 2) return await renderError(`Sparse data for ${SITE}`);

const siteName = ts.sourceInfo?.siteName || SITE;
const unit = ts.variable?.unit?.unitCode || "ft";
const latest = points[points.length - 1].v;

// ---- DRAW ----
const W = 600, H = 280;             // internal canvas (3x scale for crispness)
const padL = 44, padR = 20, padT = 60, padB = 44;
const plotW = W - padL - padR;
const plotH = H - padT - padB;

const tMin = points[0].t, tMax = points[points.length - 1].t;
let vMin = Math.min(...points.map((p) => p.v));
let vMax = Math.max(...points.map((p) => p.v));
if (vMin === vMax) { vMin -= 1; vMax += 1; }     // flat line guard
const vPad = (vMax - vMin) * 0.1;
vMin -= vPad; vMax += vPad;

const xOf = (t) => padL + ((t - tMin) / (tMax - tMin)) * plotW;
const yOf = (v) => padT + (1 - (v - vMin) / (vMax - vMin)) * plotH;

const ctx = new DrawContext();
ctx.size = new Size(W, H);
ctx.opaque = false;
ctx.respectScreenScale = true;

// background
ctx.setFillColor(BG_COLOR);
ctx.fillRect(new Rect(0, 0, W, H));

// gridlines + y labels (3 lines), right-aligned just left of the plot
ctx.setFont(Font.systemFont(16));
ctx.setTextColor(MUTED_COLOR);
ctx.setTextAlignedRight();
for (let i = 0; i <= 2; i++) {
  const v = vMin + ((vMax - vMin) * i) / 2;
  const y = yOf(v);
  const grid = new Path();
  grid.move(new Point(padL, y));
  grid.addLine(new Point(W - padR, y));
  ctx.addPath(grid);
  ctx.setStrokeColor(new Color("#334155", 0.6));
  ctx.setLineWidth(1);
  ctx.strokePath();
  ctx.drawTextInRect(v.toFixed(1), new Rect(0, y - 9, padL - 6, 18));
}
ctx.setTextAlignedLeft();

// area fill
const area = new Path();
area.move(new Point(xOf(points[0].t), yOf(points[0].v)));
for (const p of points) area.addLine(new Point(xOf(p.t), yOf(p.v)));
area.addLine(new Point(xOf(tMax), padT + plotH));
area.addLine(new Point(xOf(tMin), padT + plotH));
area.closeSubpath();
ctx.addPath(area);
ctx.setFillColor(FILL_COLOR);
ctx.fillPath();

// line
const line = new Path();
line.move(new Point(xOf(points[0].t), yOf(points[0].v)));
for (const p of points) line.addLine(new Point(xOf(p.t), yOf(p.v)));
ctx.addPath(line);
ctx.setStrokeColor(LINE_COLOR);
ctx.setLineWidth(4);
ctx.strokePath();

// x-axis labels: evenly spaced day/date ticks across the window
ctx.setFont(Font.systemFont(15));
ctx.setTextColor(MUTED_COLOR);
ctx.setTextAlignedCenter();
const xTicks = 4;
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const axisY = padT + plotH;
for (let i = 0; i <= xTicks; i++) {
  const t = tMin + ((tMax - tMin) * i) / xTicks;
  const x = xOf(t);
  // small tick mark
  const tick = new Path();
  tick.move(new Point(x, axisY));
  tick.addLine(new Point(x, axisY + 5));
  ctx.addPath(tick);
  ctx.setStrokeColor(new Color("#334155", 0.8));
  ctx.setLineWidth(1);
  ctx.strokePath();
  // label: "Mon, 6/15"
  const d = new Date(t);
  const lbl = `${dayNames[d.getDay()]}, ${d.getMonth() + 1}/${d.getDate()}`;
  ctx.drawTextInRect(lbl, new Rect(x - 60, axisY + 8, 120, 18));
}
ctx.setTextAlignedLeft();

// title + latest value
ctx.setTextColor(TEXT_COLOR);
ctx.setFont(Font.boldSystemFont(22));
ctx.drawText(truncate(siteName, 34), new Point(padL, 8));
ctx.setFont(Font.boldSystemFont(30));
ctx.drawText(`${latest.toFixed(2)} ${unit}`, new Point(padL, 28));

const img = ctx.getImage();

// ---- WIDGET ----
const widget = new ListWidget();
widget.backgroundColor = BG_COLOR;
widget.setPadding(0, 0, 0, 0);
const imgEl = widget.addImage(img);
imgEl.applyFillingContentMode();
widget.refreshAfterDate = new Date(Date.now() + 360 * 60 * 1000); // ~20 min hint

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium(); // preview when run in-app
}
Script.complete();

// ---- HELPERS ----
function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

async function renderError(msg) {
  const w = new ListWidget();
  w.backgroundColor = BG_COLOR;
  const t = w.addText("⚠️ " + msg);
  t.textColor = TEXT_COLOR;
  t.font = Font.systemFont(14);
  if (config.runsInWidget) Script.setWidget(w);
  else await w.presentMedium();
  Script.complete();
}
