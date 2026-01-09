const scrolly = document.getElementById("scrolly");
const sceneEl = document.getElementById("scene");
const kickerEl = document.getElementById("kicker");
const titleEl = document.getElementById("title");
const descEl = document.getElementById("desc");
const metaEl = document.getElementById("meta");
const imgEl = document.getElementById("img");

// HTMLからデータを読み取る（＝二重管理しない）
const nodes = [...scrolly.querySelectorAll(".scene-data")];
const scenes = nodes.map((n) => ({
  kicker: n.dataset.kicker || "",
  title: n.dataset.title || "",
  img: n.dataset.img || "",
  desc: (
    n.querySelector(".scene-desc")?.textContent ??
    n.querySelector("p")?.textContent ??
    ""
  ).trim(),
  meta: (n.querySelector(".scene-meta")?.innerHTML ?? "").trim(),
}));

// シーン数に合わせて高さを自動設定（1シーン=100vh）
const isSP = window.matchMedia("(max-width: 768px)").matches;

// SPは1シーンあたり長めにする
const SCENE_VH = isSP ? 150 : 100;

// シーン数に合わせて高さを自動設定
scrolly.style.height = `${scenes.length * SCENE_VH}vh`;

let current = -1;

function render(i) {
  if (i === current) return;
  current = i;

  sceneEl.classList.add("is-out");

  setTimeout(() => {
    const s = scenes[i];

    kickerEl.textContent = s.kicker;
    titleEl.textContent = s.title;
    descEl.textContent = s.desc;

    if (metaEl) {
      metaEl.innerHTML = s.meta;
      metaEl.style.display = s.meta ? "" : "none";
    }

    imgEl.src = s.img;
    imgEl.alt = s.title;

    // ★ 背景色切り替え（CSS管理）
    scrolly.classList.remove(
      "is-scene-0",
      "is-scene-1",
      "is-scene-2",
      "is-scene-3"
    );
    scrolly.classList.add(`is-scene-${i}`);

    sceneEl.classList.remove("is-out");
  }, 180);
}
function onScroll() {
  const rect = scrolly.getBoundingClientRect();
  const total = scrolly.offsetHeight - window.innerHeight;
  const passed = Math.min(Math.max(-rect.top, 0), total);
  const progress = total > 0 ? passed / total : 0;

  const idx = Math.min(scenes.length - 1, Math.floor(progress * scenes.length));
  render(idx);
}

window.addEventListener("scroll", onScroll, { passive: true });

render(0);
onScroll();

// splide
const splide = new Splide(".splide", {
  autoplay: true, // 自動再生
  type: "loop", // ループ
  pauseOnHover: false, // カーソルが乗ってもスクロールを停止させない
  pauseOnFocus: false, // 矢印をクリックしてもスクロールを停止させない
  interval: 5000, // 自動再生の間隔
  speed: 1000, // スライダーの移動時間
}).mount();

// モーダル
(() => {
  const dialog = document.getElementById("photo-modal");
  if (!dialog) return;

  const modalTitle = dialog.querySelector(".photo-modal-title");
  const modalDesc = dialog.querySelector(".photo-modal-desc");
  const modalImg = dialog.querySelector(".photo-modal-img");
  const closeBtn = dialog.querySelector(".photo-modal-close");

  const isSP = () => matchMedia("(hover: none) and (pointer: coarse)").matches;

  const openFromItem = (item) => {
    const textWrap = item.querySelector(".item-text");
    const imgNode = item.querySelector("img");

    // ✅ タイトル/本文を「.item-text 内の p」から安定して取得
    const ps = textWrap ? [...textWrap.querySelectorAll("p")] : [];
    const title = (ps[0]?.textContent || "").trim();

    // 2つ目のpがあればそれを説明に。なければ .item-subtext を探す。さらに無ければ空。
    const desc =
      (ps[1]?.textContent || "").trim() ||
      (textWrap?.querySelector(".item-subtext")?.textContent || "").trim() ||
      (item.querySelector(".item-subtext")?.textContent || "").trim() ||
      "";

    const src = imgNode ? imgNode.getAttribute("src") : "";
    const alt = imgNode ? imgNode.getAttribute("alt") : title;

    // モーダルへ反映
    modalTitle.textContent = title;
    modalDesc.textContent = desc;

    if (src) {
      modalImg.src = src;
      modalImg.alt = alt || "";
      modalImg.style.display = "block";
    } else {
      modalImg.removeAttribute("src");
      modalImg.alt = "";
      modalImg.style.display = "none";
    }

    dialog.showModal();
  };

  // ✅ SPだけクリックでモーダル表示（PCはhover想定）
  document.querySelectorAll(".photo-grid .item").forEach((item) => {
    item.addEventListener("click", () => {
      if (!isSP()) return;
      openFromItem(item);
    });
  });

  closeBtn?.addEventListener("click", () => dialog.close());

  // ✅ 背景クリックで閉じる（dialog外側クリック判定）
  dialog.addEventListener("click", (e) => {
    const rect = dialog.getBoundingClientRect();
    const inDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.bottom &&
      rect.left <= e.clientX &&
      e.clientX <= rect.right;

    if (!inDialog) dialog.close();
  });
})();

// 背景
(() => {
  const canvas = document.getElementById("meteor-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });

  // Retina対応
  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 以後の座標はCSS pxでOK
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  // --- 設定（好みで調整） ---
  const isSP = window.matchMedia("(max-width: 768px)").matches;

  const CONFIG = {
    meteorCount: isSP ? 18 : 32,
    starCount: isSP ? 10 : 18,
    // 残像（小さいほど尾が長く残る）
    fadeAlpha: 0.14, // 0.10〜0.20あたりが使いやすい
    angle: (3 * Math.PI) / 4,
    // 線の太さ
    lineWidthMin: 5,
    lineWidthMax: 7,
    // 長さ
    meteorLenMin: 70,
    meteorLenMax: 140,
    // 速度
    speedMin: 0.6,
    speedMax: 1.4,
  };

  // 画像っぽいグラデーション候補
  const GRADS = [
    ["#FCE7F3", "#ffe6f4ff"], // 薄ピンク系
    ["#DBEAFE", "#e1eeffff"], // 薄ブルー系
    ["#DCFCE7", "#daffe7ff"], // 薄グリーン系
    ["#EDE9FE", "#eae5ffff"], // 薄パープル系
  ];

  const DOTS = ["#FBCFE8", "#BFDBFE", "#BBF7D0", "#DDD6FE"];

  // 乱数ユーティリティ
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  // --- 星（点） ---
  class StarDot {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = rand(0, window.innerWidth);
      this.y = rand(0, window.innerHeight);
      this.r = rand(3, 5);
      this.color = pick(DOTS);
      // ちょい瞬き（任意）
      this.tw = rand(0.6, 1.0);
      this.twSpeed = rand(0.004, 0.01);
      this.phase = rand(0, Math.PI * 2);
    }
    update() {
      // ほんの少しだけ明滅
      this.phase += this.twSpeed;
      this.tw = 0.65 + Math.sin(this.phase) * 0.25; // 0.4〜0.9
    }
    draw() {
      ctx.globalAlpha = this.tw;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // --- 流れ星（グラデ線） ---
  class Meteor {
    constructor() {
      this.reset(true);
    }

    reset(first = false) {
      // 画面上側〜外から出現させる
      const w = window.innerWidth;
      const h = window.innerHeight;

      // 最初は全体に散らす／以後は上に戻す
      this.x = rand(-w * 0.2, w * 1.0);
      this.y = first ? rand(0, h) : rand(-h * 0.6, -20);

      this.len = rand(CONFIG.meteorLenMin, CONFIG.meteorLenMax);
      this.speed = rand(CONFIG.speedMin, CONFIG.speedMax);
      this.angle = CONFIG.angle;

      const [c0, c1] = pick(GRADS);
      this.c0 = c0;
      this.c1 = c1;

      this.lineWidth = rand(CONFIG.lineWidthMin, CONFIG.lineWidthMax);

      // 先端の「点」（画像みたいに）
      this.dotR = rand(5, 7);
      this.dotColor = pick([this.c0, this.c1, pick(DOTS)]);
    }

    update() {
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;

      // 画面外に出たら上に戻す
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (this.x > w + 120 || this.y > h + 120) {
        this.reset(false);
      }
    }

    draw() {
      const x2 = this.x - Math.cos(this.angle) * this.len;
      const y2 = this.y - Math.sin(this.angle) * this.len;

      const grad = ctx.createLinearGradient(this.x, this.y, x2, y2);
      grad.addColorStop(0, this.c0);
      grad.addColorStop(1, this.c1);

      ctx.strokeStyle = grad;
      ctx.lineWidth = this.lineWidth;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  // 生成
  const meteors = Array.from(
    { length: CONFIG.meteorCount },
    () => new Meteor()
  );
  const stars = Array.from({ length: CONFIG.starCount }, () => new StarDot());

  // 残像用：毎フレーム、半透明の黒を重ねる
  function fade() {
    ctx.fillStyle = `rgba(255,255,255,${CONFIG.fadeAlpha})`;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  }

  let rafId = 0;

  function tick() {
    // 背景フェード
    fade();

    // 点（星）
    for (const s of stars) {
      s.update();
      s.draw();
    }

    // 流れ星
    for (const m of meteors) {
      m.update();
      m.draw();
    }

    rafId = requestAnimationFrame(tick);
  }

  // 初期背景を黒で塗る（最初の1回）
  ctx.fillStyle = "#ffffffff";
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  // タブ非表示時は止める（省電力）
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      rafId = requestAnimationFrame(tick);
    }
  });

  tick();
})();

// ハンバーガー
const btn = document.querySelector(".hamburger");
const nav = document.querySelector(".gnav");

if (btn && nav) {
  const close = () => {
    btn.classList.remove("is-open");
    nav.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  };

  btn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    btn.classList.toggle("is-open", isOpen);
    btn.setAttribute("aria-expanded", String(isOpen));
  });

  // メニュー内リンク押したら閉じる（ページ内リンク想定）
  nav.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) close();
  });

  // Escで閉じる
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}
