// Speedrun.com Profile + Notifications Widget for Scriptable
// -------------------------------------------------------------
// SETUP (one-time, run this script in-app first, not as a widget):
//   1. Get your API key: speedrun.com/users/<your-username>/settings/api
//   2. This script will prompt you for it on first run and store it in Keychain.
// Home screen widget Parameter field = your speedrun.com user ID (see README
// for how to find it). Required — the widget shows a hint until it's set.

const USER_ID = (args.widgetParameter || "").trim();
const KEYCHAIN_KEY = "srcom_api_key";

const BG_COLOR = new Color("#0f172a");
const TEXT_COLOR = new Color("#e2e8f0");
const MUTED_COLOR = new Color("#94a3b8");
const ACCENT_COLOR = new Color("#f59e0b"); // amber, matches ReadStats deck theme
const BADGE_RED = new Color("#ef4444");

// ---- AUTH ----
async function getApiKey() {
  if (Keychain.contains(KEYCHAIN_KEY)) {
    return Keychain.get(KEYCHAIN_KEY);
  }
  if (config.runsInWidget) return null; // can't prompt from widget context
  const alert = new Alert();
  alert.title = "Speedrun.com API Key";
  alert.message = "Paste your API key from your speedrun.com Settings → API page";
  alert.addTextField("API key");
  alert.addAction("Save");
  alert.addCancelAction("Cancel");
  const idx = await alert.presentAlert();
  if (idx === -1) return null;
  const key = alert.textFieldValue(0).trim();
  if (key) Keychain.set(KEYCHAIN_KEY, key);
  return key || null;
}

// ---- FETCH: profile ----
async function fetchProfile(userId) {
  const req = new Request(`https://www.speedrun.com/api/v1/users/${userId}`);
  const data = await req.loadJSON();
  return data?.data || null;
}

// Avatar lives directly on the user object: assets.image (larger) or
// assets.icon (fallback) — no separate request needed to find the URL.
function avatarUrlFromProfile(profile) {
  const assets = profile?.assets || {};
  return assets.image?.uri || assets.icon?.uri || null;
}

async function fetchAvatar(url) {
  if (!url) return null;
  try {
    const img = await new Request(url).loadImage();
    if (!img || img.size.width < 20) return null;
    return img;
  } catch (e) {
    return null;
  }
}

async function fetchNotifications(apiKey) {
  const req = new Request("https://www.speedrun.com/api/v1/notifications?orderby=created&direction=desc");
  req.headers = { "X-API-Key": apiKey };
  const data = await req.loadJSON();
  return data?.data || [];
}

// Games this user moderates (public endpoint, no auth needed).
async function fetchModeratedGames(userId) {
  const req = new Request(`https://www.speedrun.com/api/v1/games?moderator=${userId}&max=200`);
  const data = await req.loadJSON();
  return data?.data || [];
}

// Count of runs sitting in the "new" (unverified) queue for one game.
// Capped at 200 per page — moderation queues rarely exceed that, but if
// they do we just report "200+" rather than paginating further.
async function fetchPendingRunCount(gameId) {
  try {
    const req = new Request(`https://www.speedrun.com/api/v1/runs?game=${gameId}&status=new&max=200`);
    const data = await req.loadJSON();
    const count = (data?.data || []).length;
    return count;
  } catch (e) {
    return 0;
  }
}

// Sums pending runs across every game the user moderates, in parallel.
async function fetchTotalPendingRuns(userId) {
  const games = await fetchModeratedGames(userId);
  if (games.length === 0) return { total: 0, capped: false };
  const counts = await Promise.all(games.map((g) => fetchPendingRunCount(g.id)));
  const total = counts.reduce((a, b) => a + b, 0);
  const capped = counts.some((c) => c === 200);
  return { total, capped };
}

// ---- HELPERS ----
function nameColor(profile) {
  // Uses the same color the username displays in on speedrun.com itself.
  const style = profile?.["name-style"];
  if (!style) return ACCENT_COLOR;
  const hex = style.style === "gradient" ? style["color-from"]?.dark : style.color?.dark;
  return hex ? new Color(hex) : ACCENT_COLOR;
}

// Builds a solid-color square with a centered initial, used as the
// avatar fallback when no image is available. WidgetImage.cornerRadius
// (set at the call site) is what actually makes it render as a circle —
// DrawContext has no clipping API, so we don't fight it here.
function initialAvatarImage(initial, color, size) {
  const ctx = new DrawContext();
  ctx.size = new Size(size, size);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  ctx.setFillColor(color);
  ctx.fillRect(new Rect(0, 0, size, size));
  ctx.setFont(Font.boldSystemFont(size * 0.42));
  ctx.setTextColor(new Color("#0f172a"));
  ctx.setTextAlignedCenter();
  ctx.drawTextInRect(initial.toUpperCase(), new Rect(0, size * 0.28, size, size * 0.5));
  return ctx.getImage();
}

// ---- WIDGET BUILD ----
async function buildWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = BG_COLOR;
  widget.setPadding(14, 12, 14, 12);

  // No user ID set yet. When run in-app, still surface the API-key prompt so
  // first-run setup can save it; either way, tell the user to fill in the
  // widget's Parameter field with their speedrun.com user ID.
  if (!USER_ID) {
    if (!config.runsInWidget) await getApiKey();
    const hint = widget.addText("Set this widget's Parameter to your speedrun.com user ID (see README).");
    hint.font = Font.systemFont(12);
    hint.textColor = TEXT_COLOR;
    hint.centerAlignText();
    return widget;
  }

  let profile = null;
  try {
    profile = await fetchProfile(USER_ID);
  } catch (e) {
    // proceed without profile; not fatal
  }

  const username = profile?.names?.international || USER_ID;
  const initial = username.charAt(0);
  const accentColor = nameColor(profile);

  const avatarImg = profile ? await fetchAvatar(avatarUrlFromProfile(profile)) : null;

  const apiKey = await getApiKey();
  let notifications = [];
  if (apiKey) {
    try {
      notifications = await fetchNotifications(apiKey);
    } catch (e) {
      notifications = [];
    }
  }
  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  // profile.role is the site-wide role — separate from per-game moderation,
  // which most moderators hold without an elevated site role. So we always
  // check moderated games; the fetch short-circuits if the list is empty.
  let pendingRuns = { total: 0, capped: false };
  try {
    pendingRuns = await fetchTotalPendingRuns(USER_ID);
  } catch (e) {
    pendingRuns = { total: 0, capped: false };
  }

  // ---- Header: avatar + badge on the left, name + join date on the right ----
  const AVATAR_SIZE = 50;
  const header = widget.addStack();
  header.centerAlignContent();

  const avatarSlot = header.addStack();

  const avatarPic = avatarImg || initialAvatarImage(initial, accentColor, AVATAR_SIZE * 2);
  const avatarEl = avatarSlot.addImage(avatarPic);
  avatarEl.imageSize = new Size(AVATAR_SIZE, AVATAR_SIZE);
  avatarEl.cornerRadius = AVATAR_SIZE / 2;
  avatarEl.applyFillingContentMode();

  header.addSpacer(8);

  const nameStack = header.addStack();
  nameStack.layoutVertically();

  const nameText = nameStack.addText(username);
  nameText.font = Font.boldSystemFont(15);
  nameText.textColor = TEXT_COLOR;
  nameText.lineLimit = 1;

  if (profile?.signup) {
    const joinText = nameStack.addText(`since ${new Date(profile.signup).getFullYear()}`);
    joinText.font = Font.systemFont(11);
    joinText.textColor = MUTED_COLOR;
  }

  header.addSpacer(); // spring, pushes name block against the avatar

  widget.addSpacer(12);

  // ---- Stats row: unread + to-review, centered, large ----
  const statsRow = widget.addStack();
  statsRow.addSpacer(); // spring

  const unreadStat = statsRow.addText(apiKey ? `🔔 ${unreadCount}` : "🔔 —");
  unreadStat.font = Font.boldSystemFont(22);
  unreadStat.textColor = unreadCount > 0 ? BADGE_RED : MUTED_COLOR;

  if (pendingRuns.total > 0) {
    statsRow.addSpacer(18);
    const modLabel = pendingRuns.capped ? "200+" : String(pendingRuns.total);
    const modStat = statsRow.addText(`🗡️ ${modLabel}`);
    modStat.font = Font.boldSystemFont(22);
    modStat.textColor = ACCENT_COLOR;
  }

  statsRow.addSpacer(); // spring

  if (!apiKey) {
    widget.addSpacer(6);
    const hint = widget.addText("Run in-app to add API key");
    hint.font = Font.systemFont(10);
    hint.textColor = MUTED_COLOR;
    hint.centerAlignText();
  }

  widget.url = "https://www.speedrun.com";
  widget.refreshAfterDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // ~1x/day

  return widget;
}

const widget = await buildWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentSmall();
}
Script.complete();
