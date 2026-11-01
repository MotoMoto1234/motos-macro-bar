/* Moto's Macro Bar. Modified/new standalone implementation, 2026-11-01.
 * GPL-3.0; see LICENSE and NOTICE.txt for attribution.
 */

export function conflictingModules() {
    return ["monks-hotbar-expansion", "responsive-monks-hotbar"]
        .some(id => game.modules.get(id)?.active);
}

export function syncHideControl(hotbar) {
    if (!hotbar.classList.contains("mmb-owned")) return;
    let controls = hotbar.querySelector("#hotbar-controls-right");
    if (!controls) return;
    let carolingian = controls.querySelector("#hotbar-collapse-btn");
    let own = controls.querySelector("[data-action=motoToggleHide]");
    if (carolingian) own?.remove();
    else if (!own) {
        own = document.createElement("button");
        own.type = "button";
        own.className = "ui-control icon fa-solid";
        own.dataset.action = "motoToggleHide";
        controls.append(own);
    }
    let hidden = !carolingian && game.settings.get("motos-macro-bar", "auto-hide");
    hotbar.classList.toggle("mmb-auto-hide", Boolean(hidden));
    if (own && !carolingian) {
        own.classList.toggle("fa-angle-up", Boolean(hidden));
        own.classList.toggle("fa-angle-down", !hidden);
        let label = hidden ? "Keep macro bar visible" : "Auto-hide macro bar";
        if (own.dataset.tooltip !== label) {
            own.dataset.tooltip = label;
            own.setAttribute("aria-label", label);
        }
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
                motoToggleHide: async function () {
                    let hidden = game.settings.get("motos-macro-bar", "auto-hide");
                    await game.settings.set("motos-macro-bar", "auto-hide", !hidden);
                }
            }
        };

        async _onRender(context, options) {
            let enabled = game.settings.get("motos-macro-bar", "enabled");
            this.element.classList.toggle("mmb-owned", enabled);
            if (enabled) {
                buildPages(this.element, this.page);
                syncHideControl(this.element);
            } else {
                this.element.querySelector("#hotbar-page")?.remove();
                this.element.querySelector("[data-action=motoToggleHide]")?.remove();
                this.element.classList.remove("mmb-active", "mmb-auto-hide");
            }
            await super._onRender(context, options);
        }
    };
}
