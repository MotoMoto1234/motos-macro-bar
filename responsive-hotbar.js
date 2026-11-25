import { conflictingModules, installHotbar, restoreControls, syncControls } from "./hotbar.mjs";
import { chooseLayout } from "./layout.mjs";

let frame = 0;
let resizeObserver;
let mutationObserver;
let monitoring = false;
let initialized = false;
let observed = new Set();
let mutationTargets = new Map();
let metrics;
let unscaledSize = (element, dimension, style = getComputedStyle(element)) => {
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
    metrics = undefined;
    if (monitoring && !frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
};
let structuralSelector = "#interface, #ui-middle, #ui-bottom, #ui-right, #hotbar, #players, #players-active, #sidebar, #sidebar-tabs, #chat-notifications";
let attributeSelector = `${structuralSelector}, #hotbar-controls-right, #chat-notifications .chat-log`;

function affectsLayout(record) {
    if (record.type === "childList") {
        if (record.target.closest("#hotbar")) return true;
        return [...record.addedNodes, ...record.removedNodes].some(node => node instanceof Element &&
            (node.matches(structuralSelector) || node.querySelector(structuralSelector)
                || node.matches(".chat-log") && record.target.id === "chat-notifications"));
    }
    if (record.target === document.body || record.target === document.documentElement) return true;
    if (record.attributeName === "style" && record.target.closest("#hotbar")) {
        let externalStyle = text => (text ?? "").split(";").map(value => value.trim())
            .filter(value => value && !value.startsWith("--mmb-")).join(";");
        return externalStyle(record.oldValue) !== externalStyle(record.target.getAttribute("style"));
    }
    return record.target.matches(attributeSelector) || mutationTargets.has(record.target);
}

function observeLayout() {
    if (!monitoring) return;
    let targets = new Map();
    for (let element of document.querySelectorAll(attributeSelector)) {
        targets.set(element, element.id === "hotbar");
        for (let parent = element.parentElement; parent; parent = parent.parentElement) {
            if (!targets.has(parent)) targets.set(parent, false);
        }
    }
    targets.set(document.body, false);
    targets.set(document.documentElement, false);
    if (targets.size === mutationTargets.size && [...targets].every(([element, subtree]) =>
        mutationTargets.get(element) === subtree)) return;
    mutationObserver.disconnect();
    for (let [element, subtree] of targets) {
        mutationObserver.observe(element, {
            childList: !element.matches("#chat-notifications .chat-log"), subtree,
            attributes: true, attributeOldValue: true, attributeFilter: ["class", "style", "hidden"]
        });
    }
    mutationTargets = targets;
}

function stopMonitoring() {
    monitoring = false;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    mutationObserver?.disconnect();
    resizeObserver?.disconnect();
    observed.clear();
    mutationTargets.clear();
    metrics = undefined;
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
        observeLayout();
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
    observeLayout();
    let hotbar = document.getElementById("hotbar");
    if (!hotbar) return;
    if (!game.settings.get("motos-macro-bar", "enabled")) {
        if (hotbar.classList.contains("mmb-active")) hotbar.classList.remove("mmb-active");
        restoreControls(hotbar);
        delete hotbar.dataset.responsiveLayout;
        for (let element of [hotbar, ...hotbar.querySelectorAll(".hotbar-page-row")]) {
            for (let property of [...element.style]) {
                if (property.startsWith("--mmb-")) element.style.removeProperty(property);
            }
        }
        stopMonitoring();
        return;
    }
    let controls = syncControls(hotbar);
    let page = hotbar.querySelector("#hotbar-page");
    let rows = [...hotbar.querySelectorAll(".hotbar-page-row")];
    let enabled = controls && page && rows.length === 5;
    hotbar.classList.toggle("mmb-active", Boolean(enabled));
    if (!enabled) return;
    let arrangement = game.settings.get("motos-macro-bar", "layout");
    if (hotbar.dataset.responsiveLayout !== arrangement) hotbar.dataset.responsiveLayout = arrangement;
    let parent = hotbar.parentElement;
    let parentRect = parent.getBoundingClientRect();
    let scale = parentRect.width / parent.offsetWidth || 1;
    let bar = rows[0].querySelector(".action-bar");
    let slots = [...bar.querySelectorAll(".slot")];
    if (!metrics || metrics.bar !== bar || metrics.controls !== controls || metrics.arrangement !== arrangement) {
        let style = getComputedStyle(bar);
        let controlsStyle = getComputedStyle(controls);
        let sizes = slots.map(slot => {
            let slotStyle = getComputedStyle(slot);
            return {width: unscaledSize(slot, "width", slotStyle), height: unscaledSize(slot, "height", slotStyle)};
        });
        metrics = {
            bar, controls, arrangement,
            barWidth: sizes.reduce((sum, size) => sum + size.width, 0)
                + (parseFloat(style.columnGap) || 0) * (slots.length - 1),
            barHeight: Math.max(...sizes.map(size => size.height)),
            controlWidth: unscaledSize(controls, "width", controlsStyle),
            controlHeight: unscaledSize(controls, "height", controlsStyle)
        };
    }
    let {barWidth, barHeight, controlWidth, controlHeight} = metrics;
    if (!barWidth || !barHeight) return;
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
    let layout = chooseLayout(arrangement, (right - left) / scale, barWidth, barHeight,
        controlWidth, controlHeight, page.classList.contains("reverse"));
    let previousShift = parseFloat(hotbar.style.getPropertyValue("--mmb-shift")) || 0;
    let rect = hotbar.getBoundingClientRect();
    let naturalCenter = (rect.left + rect.right) / 2 - previousShift * scale;
    let fittedScale = scale * (layout.fit || 1);
    let bottomInset = (document.documentElement.clientHeight - rect.bottom) / fittedScale;
    let screenBottom = layout.height + bottomInset;
    let fit = String(layout.fit);
    if (hotbar.style.getPropertyValue("--mmb-fit") !== fit) hotbar.style.setProperty("--mmb-fit", fit);
    setPixels(hotbar, "--mmb-width", layout.width);
    setPixels(hotbar, "--mmb-height", layout.height);
    setPixels(hotbar, "--mmb-bar-width", barWidth);
    setPixels(hotbar, "--mmb-bar-height", barHeight);
    setPixels(hotbar, "--mmb-controls-x", layout.controls.x);
    setPixels(hotbar, "--mmb-controls-y", layout.controls.y);
    setPixels(hotbar, "--mmb-page-slide", screenBottom + 2 / fittedScale);
    setPixels(hotbar, "--mmb-dock-slide", screenBottom - layout.controls.y - controlHeight - 4 / fittedScale);
    setPixels(hotbar, "--mmb-edge-bottom", -bottomInset);
    setPixels(hotbar, "--mmb-edge-top", screenBottom - 8 / fittedScale);
    setPixels(hotbar, "--mmb-shift", ((left + right) / 2 - naturalCenter) / scale);
    for (let placement of layout.pages) {
        let row = rows.find(row => Number(row.dataset.page) === placement.page);
        setPixels(row, "--mmb-x", placement.x);
        setPixels(row, "--mmb-y", placement.y);
    }
    let targets = new Set([parent, hotbar, controls, ...slots, ...obstacles]);
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
        scope: "client", config: false, type: Boolean, default: false
    });
    game.settings.register("motos-macro-bar", "visibility", {
        scope: "client", config: false, type: String, default: "", onChange: schedule
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
