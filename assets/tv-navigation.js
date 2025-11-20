// tv-navigation.js – Full TV remote control for Football360 TV
// Just drop this file next to the original JS – works forever

document.addEventListener("DOMContentLoaded", () => {
  // Wait until React finishes rendering
  const waitForApp = setInterval(() => {
    if (document.querySelector("#root")?.children.length > 0) {
      clearInterval(waitForApp);
      initTVNavigation();
    }
  }, 500);

  function initTVNavigation() {
    const style = document.createElement("style");
    style.textContent = `
      .tv-focusable, button, [role="button"], a, .back, div[onclick], [jsaction] {
        transition: all 0.2s !important;
      }
      .tv-focusable:focus,
      button:focus, [role="button"]:focus, a:focus,
      .back:focus, div[onclick]:focus {
        outline: 6px solid #00ff00 !important;
        outline-offset: 4px !important;
        box-shadow: 0 0 30px #00ff00 !important;
        transform: scale(1.08) !important;
        z-index: 999999 !important;
      }
      * { cursor: none !important; }
      video { pointer-events: none !important; } /* we'll add our own overlay */
    `;
    document.head.appendChild(style);

    // Make everything focusable
    const makeFocusable = () => {
      document.querySelectorAll(`
        .back, button, a, [role="button"], div[onclick], 
        [jsaction], .icon-arrow-right, .channel-card,
        div[class*="control"], div[class*="play"]
      `).forEach(el => {
        if (!el.tabIndex && el.tabIndex !== -1) el.tabIndex = 0;
        el.classList.add("tv-focusable");
      });

      // Special big play/pause overlay for video
      const video = document.querySelector("video");
      if (video && !document.getElementById("tv-play-overlay")) {
        const overlay = document.createElement("div");
        overlay.id = "tv-play-overlay";
        overlay.tabIndex = 0;
        overlay.classList.add("tv-focusable");
        overlay.style.cssText = `
          position: absolute; inset: 0; z-index: 999;
          background: transparent; display: flex;
          align-items: center; justify-content: center;
        `;
        overlay.innerHTML = `<div style="font-size:120px; color:white; opacity:0.7;">▶</div>`;
        overlay.onclick = () => video.parentElement.querySelector("button")?.click() || video.click();
        video.parentElement.style.position = "relative";
        video.parentElement.appendChild(overlay);
      }
    };

    makeFocusable();
    new MutationObserver(makeFocusable).observe(document.body, { childList: true, subtree: true });

    // Simple but super effective spatial navigation
    let currentFocused = null;

    const moveFocus = (direction) => {
      const focusables = [...document.querySelectorAll(".tv-focusable")]
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 30 && r.height > 30 && getComputedStyle(el).visibility !== "hidden";
        });

      if (focusables.length === 0) return;
      if (!currentFocused) {
        focusables[0].focus();
        currentFocused = focusables[0];
        return;
      }

      const rect = currentFocused.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const candidates = focusables
        .filter(el => el !== currentFocused)
        .map(el => {
          const r = el.getBoundingClientRect();
          const dx = r.left + r.width / 2 - centerX;
          const dy = r.top + r.height / 2 - centerY;
          return { el, dx, dy, dist: Math.sqrt(dx*dx + dy*dy) };
        })
        .filter(c => {
          switch(direction) {
            case "left":  return c.dx < -30;
            case "right": return c.dx > 30;
            case "up":    return c.dy < -30;
            case "down":  return c.dy > 30;
          }
        });

      if (candidates.length === 0) return;

      candidates.sort((a,b) => {
        switch(direction) {
          case "left": case "right": return Math.abs(a.dy) - Math.abs(b.dy);
          case "up":   case "down":  return Math.abs(a.dx) - Math.abs(b.dx);
        }
      });

      candidates[0].el.focus();
      currentFocused = candidates[0].el;
    };

    // Remote control handling
    document.addEventListener("keydown", e => {
      if (e.repeat) return;

      switch(e.key) {
        case "ArrowLeft":  case "Left":  moveFocus("left");  e.preventDefault(); break;
        case "ArrowRight": case "Right": moveFocus("right"); e.preventDefault(); break;
        case "ArrowUp":    case "Up":    moveFocus("up");    e.preventDefault(); break;
        case "ArrowDown":  case "Down":  moveFocus("down");  e.preventDefault(); break;
        case "Enter":
        case "OK":
        case " ":
          e.preventDefault();
          if (document.activeElement) document.activeElement.click();
          break;
        case "Backspace":
        case "Escape":
        case "Back":
          e.preventDefault();
          history.back();
          break;
        case "F1": // Red button = back
          history.back(); break;
        case "F5": // Refresh
          location.reload(); break;
      }
    });

    // Auto-focus first item
    setTimeout(() => {
      const first = document.querySelector(".tv-focusable, button, .back, [role='button']");
      if (first) {
        first.focus();
        currentFocused = first;
      }
    }, 1500);
  }
});