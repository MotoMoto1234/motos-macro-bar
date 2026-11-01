import { conflictingModules, installHotbar, syncHideControl } from "./hotbar.mjs";
import { chooseLayout } from "./layout.mjs";

let frame = 0;
let resizeObserver;
let mutationObserver;
let monitoring = false;
let initialized = false;
let observed = new Set();
let unscaledSize = (element, dimension) => {
    let style = getComputedStyle(element);
    let size = parseFloat(style[dimension]);
    if (!Number.isFinite(size)) return dimension === "width" ? element.offsetWidth : element.offsetHeight;
    if (style.boxSizing === "border-box") return size;
    let edges = dimension === "width" ? ["Left", "Right"] : ["Top", "Bottom"];
    return size + edges.reduce((sum, edge) => sum + (parseFloat(style[`padding${edge}`]) || 0)
        + (parseFloat(style[`border${edge}Width`]) || 0), 0);
};
let setPixels = (element, name, value) => {
    let text = `${Math.round(value * 100) / 100}px`;
    if (element.style.getPropertyValue(name) !== text) element.style.setProperty(name, text);
};
let schedule = () => {
    if (monitoring && !frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
};
let structuralSelector = "#hotbar, #players, #players-active, #sidebar, #sidebar-tabs, #chat-notifications";
let attributeSelector = `${structuralSelector}, #ui-middle, #ui-bottom, #ui-right, #hotbar-controls-left, #hotbar-controls-right, #chat-notifications .chat-log`;

function affectsLayout(record) {
    if (record.type === "childList") {
        if (record.target.closest("#hotbar")) return true;
        return [...record.addedNodes, ...record.removedNodes].some(node => node instanceof Element &&
            (node.matches(structuralSelector) || node.querySelector(structuralSelector)));
    }
    if (record.target === document.body || record.target === document.documentElement) return true;
    if (record.attributeName === "style" && record.target.closest("#hotbar")) return false;
    return record.target.matches(attributeSelector);
}

function stopMonitoring() {
    monitoring = false;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    mutationObserver?.disconnect();
    resizeObserver?.disconnect();
    observed.clear();
    window.removeEventListener("resize", schedule);
}

function configureMonitoring() {
    if (!initialized || conflictingModules()) return;
    if (!game.settings.get("motos-macro-bar", "enabled")) {
        stopMonitoring();
        update();
        return;
    }
    if (!monitoring) {
        monitoring = true;
        mutationObserver.observe(document.body, {
            subtree: true, childList: true, attributes: true, attributeFilter: ["class", "style", "hidden"]
        });
        mutationObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
        window.addEventListener("resize", schedule);
    }
    schedule();
}

async function refreshHotbar() {
    await ui.hotbar?.render({force: true});
    configureMonitoring();
}
let visibleRect = element => {
    if (!element || !element.getClientRects().length) return null;
    let style = getComputedStyle(element);
    if (style.visibility === "hidden" || style.display === "none") return null;
    let rect = element.getBoundingClientRect();
    return rect.width > 0 && (rect.height > 0 || element.id === "chat-notifications") ? rect : null;
};

function update() {
    if (conflictingModules()) return;
    let hotbar = document.getElementById("hotbar");
    if (!hotbar) return;
    if (!game.settings.get("motos-macro-bar", "enabled")) {
        if (hotbar.classList.contains("mmb-active")) hotbar.classList.remove("mmb-active");
        delete hotbar.dataset.responsiveLayout;
        for (let element of [hotbar, ...hotbar.querySelectorAll(".hotbar-page-row")]) {
            for (let property of [...element.style]) {
                if (property.startsWith("--mmb-")) element.style.removeProperty(property);
            }
        }
        stopMonitoring();
        return;
    }
    syncHideControl(hotbar);
    let page = hotbar.querySelector("#hotbar-page");
    let rows = [...hotbar.querySelectorAll(".hotbar-page-row")];
    let enabled = hotbar.classList.contains("mmb-owned") && page && rows.length === 5;
    hotbar.classList.toggle("mmb-active", Boolean(enabled));
    if (!enabled) return;
    let parent = hotbar.parentElement;
    let scale = parent.getBoundingClientRect().width / parent.offsetWidth || 1;
    let bar = rows[0].querySelector(".action-bar");
    let slots = [...bar.querySelectorAll(".slot")];
    let style = getComputedStyle(bar);
    let barWidth = slots.reduce((sum, slot) => sum + unscaledSize(slot, "width"), 0)
        + (parseFloat(style.columnGap) || 0) * (slots.length - 1);
    let barHeight = Math.max(...slots.map(slot => unscaledSize(slot, "height")));
    if (!barWidth || !barHeight) return;
    let leftGlobal = unscaledSize(hotbar.querySelector("#hotbar-controls-left"), "width") + 4;
    let rightGlobal = unscaledSize(hotbar.querySelector("#hotbar-controls-right"), "width") + 4;
    let left = 8;
    let right = document.documentElement.clientWidth - 8;
    let obstacles = [...document.querySelectorAll("#players, #players-active, #sidebar, #sidebar-tabs")];
    if (game.settings.get("core", "uiConfig")?.chatNotifications === "cards") {
        let notifications = document.getElementById("chat-notifications");
        let log = notifications?.querySelector(".chat-log");
        if (log && !log.hidden) obstacles.push(notifications);
    }
    for (let obstacle of obstacles) {
        let rect = visibleRect(obstacle);
        if (!rect) continue;
        if (obstacle.id.startsWith("players")) left = Math.max(left, rect.right + 8);
        else right = Math.min(right, rect.left - 8);
    }
    let arrangement = game.settings.get("motos-macro-bar", "layout");
    let layout = chooseLayout(arrangement, (right - left) / scale, barWidth, barHeight,
        leftGlobal, rightGlobal, page.classList.contains("reverse"));
    hotbar.dataset.responsiveLayout = arrangement;
    let fit = String(layout.fit);
    if (hotbar.style.getPropertyValue("--mmb-fit") !== fit) hotbar.style.setProperty("--mmb-fit", fit);
    setPixels(hotbar, "--mmb-width", layout.width);
    setPixels(hotbar, "--mmb-height", layout.height);
    setPixels(hotbar, "--mmb-bar-width", barWidth);
    setPixels(hotbar, "--mmb-bar-height", barHeight);
    let previousShift = parseFloat(hotbar.style.getPropertyValue("--mmb-shift")) || 0;
    let rect = hotbar.getBoundingClientRect();
    let naturalCenter = (rect.left + rect.right) / 2 - previousShift * scale;
    setPixels(hotbar, "--mmb-shift", ((left + right) / 2 - naturalCenter) / scale);
    for (let placement of layout.pages) {
        let row = rows.find(row => Number(row.dataset.page) === placement.page);
        setPixels(row, "--mmb-x", placement.x);
        setPixels(row, "--mmb-y", placement.y);
    }
    let targets = new Set([parent, hotbar, ...slots, ...obstacles,
        hotbar.querySelector("#hotbar-controls-left"), hotbar.querySelector("#hotbar-controls-right")]);
    for (let target of observed) if (!targets.has(target)) resizeObserver.unobserve(target);
    for (let target of targets) if (!observed.has(target)) resizeObserver.observe(target);
    observed = targets;
}

Hooks.once("setup", installHotbar);

Hooks.once("init", () => {
    game.settings.register("motos-macro-bar", "reverse-order", {
        name: "Reverse page order", scope: "client", config: true, type: Boolean, default: false,
        onChange: async () => {
            if (game.settings.get("motos-macro-bar", "enabled")) await refreshHotbar();
        }
    });
    game.settings.register("motos-macro-bar", "auto-hide", {
        scope: "client", config: false, type: Boolean, default: false, onChange: schedule
    });
    game.settings.register("motos-macro-bar", "enabled", {
        name: "Enable Moto's Macro Bar",
        hint: "Enable this module's layout, scaling, control changes, and Carolingian collapse fix for this client only. Turn off to restore the original hotbar. Changes apply without reloading.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: refreshHotbar
    });
    game.settings.register("motos-macro-bar", "layout", {
        name: "Expanded hotbar layout",
        hint: "Keep this arrangement and shrink the entire hotbar to fit between the player panel and sidebar. Applies to this client. All five pages are displayed.",
        scope: "client",
        config: true,
        type: String,
        choices: {
            "2:1:2": "2:1:2 — two left, one center, two right",
            "0:5:0": "0:5:0 — five stacked in the center",
            "3:2": "3:2 — three left, two right"
        },
        default: "2:1:2",
        onChange: schedule
    });
});

Hooks.once("ready", () => {
    if (conflictingModules()) return;
    resizeObserver = new ResizeObserver(schedule);
    mutationObserver = new MutationObserver(records => {
        if (records.some(affectsLayout)) schedule();
    });
    initialized = true;
    Hooks.on("renderHotbar", schedule);
    Hooks.on("renderChatInput", schedule);
    Hooks.on("closeUIConfig", schedule);
    configureMonitoring();
});
