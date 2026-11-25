/* Moto's Macro Bar. Modified/new standalone implementation, 2026-11-01.
 * GPL-3.0; see LICENSE and NOTICE.txt for attribution.
 */

export function conflictingModules() {
    return ["monks-hotbar-expansion", "responsive-monks-hotbar"]
        .some(id => game.modules.get(id)?.active);
}

const visibilityModes = {
    show: {label: "Show", icon: "fa-eye"},
    hide: {label: "Hide", icon: "fa-eye-slash"},
    "auto-hide": {label: "Auto-hide", icon: "fa-angle-up"}
};
const rightClickModes = {
    show: "auto-hide",
    hide: "auto-hide-from-hide",
    "auto-hide": "show",
    "auto-hide-from-hide": "hide"
};
const suppressedCollapse = new WeakSet();

function getVisibilityPreference() {
    const saved = game.settings.get("motos-macro-bar", "visibility");
    if (Object.hasOwn(rightClickModes, saved)) return saved;
    return game.settings.get("motos-macro-bar", "auto-hide") ? "auto-hide" : "show";
}

export function syncControls(hotbar) {
    if (!hotbar.classList.contains("mmb-owned")) return;
    let controls = hotbar.querySelector("#hotbar-controls-right");
    if (!controls) return;
    let menu = hotbar.querySelector('button[data-action="menu"]');
    let lock = controls.querySelector('button[data-action="lock"]');
    if (!menu || !lock) return;
    if (!controls.classList.contains("mmb-control-group")) {
        controls.classList.add("mmb-control-group");
        controls.setAttribute("role", "group");
        controls.setAttribute("aria-label", "Macro bar controls");
        controls.dataset.tooltipDirection = "UP";
    }
    if (!hotbar.querySelector(":scope > .mmb-hover-area")) {
        const hoverArea = document.createElement("div");
        hoverArea.className = "mmb-hover-area";
        hoverArea.setAttribute("aria-hidden", "true");
        hotbar.prepend(hoverArea);
    }
    if (hotbar.classList.contains("collapsed")) {
        suppressedCollapse.add(hotbar);
        hotbar.classList.remove("collapsed");
    }
    let collapse = controls.querySelector("[data-action=motoToggleVisibility]");
    if (!collapse) {
        collapse = document.createElement("button");
        collapse.type = "button";
        collapse.className = "ui-control icon fa-solid";
        collapse.dataset.action = "motoToggleVisibility";
        controls.append(collapse);
    }
    if (menu.parentElement !== controls) controls.append(menu);
    if (menu.nextElementSibling !== collapse) menu.after(collapse);
    if (collapse.nextElementSibling !== lock) collapse.after(lock);
    const preference = getVisibilityPreference();
    const mode = preference === "auto-hide-from-hide" ? "auto-hide" : preference;
    const {label, icon} = visibilityModes[mode];
    if (hotbar.dataset.mmbVisibility !== mode) hotbar.dataset.mmbVisibility = mode;
    if (!collapse.classList.contains(icon)) {
        collapse.classList.remove(...Object.values(visibilityModes).map(mode => mode.icon));
        collapse.classList.add(icon);
        const tooltip = `Macro bar is set to ${label}. Left-click to ${mode === "hide" ? "show" : "hide"}. `
            + `Right-click to turn Auto-hide ${mode === "auto-hide" ? "off" : "on"}.`;
        collapse.dataset.tooltip = tooltip;
        collapse.setAttribute("aria-label", tooltip);
    }
    return controls;
}

export function restoreControls(hotbar) {
    let controls = hotbar.querySelector("#hotbar-controls-right");
    if (!controls?.classList.contains("mmb-control-group")) return;
    let menu = controls.querySelector('button[data-action="menu"]');
    let lock = controls.querySelector('button[data-action="lock"]');
    if (menu) hotbar.querySelector("#hotbar-controls-left")?.append(menu);
    if (lock) controls.querySelector(":scope > div.flexcol")?.prepend(lock);
    controls.querySelector("[data-action=motoToggleVisibility]")?.remove();
    hotbar.querySelector(":scope > .mmb-hover-area")?.remove();
    controls.classList.remove("mmb-control-group");
    controls.removeAttribute("role");
    controls.removeAttribute("aria-label");
    controls.dataset.tooltipDirection = "RIGHT";
    delete hotbar.dataset.mmbVisibility;
    if (suppressedCollapse.delete(hotbar)) {
        const saved = game.modules.get("crlngn-ui")?.active ? game.user.getFlag("crlngn-ui", "hotbarCollapsed") : undefined;
        hotbar.classList.toggle("collapsed", saved ?? true);
    }
}

export function buildPages(hotbar, activePage) {
    hotbar.querySelector("#hotbar-page")?.remove();
    let pages = document.createElement("div");
    pages.id = "hotbar-page";
    pages.className = "hotbar-page flexcol";
    pages.classList.toggle("reverse", game.settings.get("motos-macro-bar", "reverse-order"));
    for (let page = 1; page <= 5; page++) {
        let row = document.createElement("div");
        row.className = "hotbar-page-row flexrow";
        row.classList.toggle("selected", page === activePage);
        row.dataset.page = String(page);
        let nav = document.createElement("nav");
        nav.className = "macro-list flexrow";
        nav.setAttribute("aria-label", `Macro page ${page}`);
        let bar = document.createElement("menu");
        bar.className = "action-bar flexrow";
        bar.dataset.page = String(page);
        bar.dataset.tooltipDirection = "UP";
        for (let [index, assignment] of game.user.getHotbarMacros(page).entries()) {
            let macro = assignment.macro;
            let slot = document.createElement("li");
            slot.className = `slot ${macro ? "full" : "open"}`;
            slot.setAttribute("role", "button");
            slot.dataset.action = "execute";
            slot.dataset.slot = String(assignment.slot);
            slot.setAttribute("aria-label", macro?.name ?? game.i18n.localize("HOTBAR.EMPTY"));
            if (macro) {
                slot.dataset.macroId = macro.id;
                slot.dataset.tooltipText = macro.name;
                let image = document.createElement("img");
                image.className = "slot-icon";
                image.src = macro.img;
                image.alt = macro.name;
                slot.append(image);
            }
            let key = document.createElement("span");
            key.className = "key";
            key.textContent = String((index + 1) % 10);
            slot.append(key);
            bar.append(slot);
        }
        nav.append(bar);
        row.append(nav);
        pages.append(row);
    }
    hotbar.append(pages);
}

export function installHotbar() {
    if (conflictingModules()) {
        Hooks.once("ready", () => ui.notifications.warn("Moto's Macro Bar is inactive: disable Monk's Hotbar Expansion and Responsive Monk's Hotbar, then reload."));
        return;
    }
    let OriginalHotbar = CONFIG.ui.hotbar;
    CONFIG.ui.hotbar = class MotoMacroBar extends OriginalHotbar {
        static DEFAULT_OPTIONS = {
            actions: {
                motoToggleVisibility: {
                    buttons: [0, 2],
                    handler: async function (event) {
                        const preference = getVisibilityPreference();
                        const rightClick = event.type === "contextmenu";
                        if (rightClick) event.preventDefault();
                        const next = rightClick ? rightClickModes[preference] : preference === "hide" ? "show" : "hide";
                        await game.settings.set("motos-macro-bar", "visibility", next);
                        syncControls(this.element);
                    }
                }
            }
        };

        async _onRender(context, options) {
            let enabled = game.settings.get("motos-macro-bar", "enabled");
            this.element.classList.toggle("mmb-owned", enabled);
            if (enabled) {
                buildPages(this.element, this.page);
                syncControls(this.element);
            } else {
                restoreControls(this.element);
                this.element.querySelector("#hotbar-page")?.remove();
                this.element.classList.remove("mmb-active");
            }
            await super._onRender(context, options);
        }
    };
}
