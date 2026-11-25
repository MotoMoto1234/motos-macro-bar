# Moto’s Macro Bar

[![Moto’s Macro Bar 1.0.4](https://img.shields.io/badge/Macro%20Bar-1.0.4-435D8C?style=for-the-badge)](https://github.com/MotoMoto1234/motos-macro-bar/releases)
[![Foundry VTT 13.351](https://img.shields.io/badge/Foundry%20VTT-13.351-287D3C?style=for-the-badge&logo=foundryvirtualtabletop&logoColor=white)](#compatibility)
[![Carolingian UI 2.31.6 optional](https://img.shields.io/badge/Carolingian%20UI-2.31.6%20%28Optional%29-684785?style=for-the-badge)](#compatibility)

[![Buy me a coffee on Ko-fi](https://img.shields.io/badge/Buy%20me%20a%20coffee-FF5E5B?style=for-the-badge&logo=kofi&logoColor=white)](https://ko-fi.com/motomoto0295)

> [!IMPORTANT]
> **My release-testing pledge**  
> I test every build in my live Foundry games before releasing it. Hotfixes are the only exception. This pledge applies to all of my Foundry modules.

Moto’s Macro Bar shows all five Foundry VTT macro pages at once. Pick a layout and the bar shrinks to fit between the player list and sidebar as available space changes.

## Compatibility

- **Foundry VTT 13.351** is the supported baseline. The module works independently of the game system.
- **Carolingian UI 2.31.6** is optional and covered by the browser checks.
- Disable **Monk’s Hotbar Expansion** and **Responsive Monk’s Hotbar** before using Moto’s Macro Bar.

## Install

1. In Foundry Setup, open **Add-on Modules → Install Module** and paste this manifest URL.

   ```text
   https://github.com/MotoMoto1234/motos-macro-bar/releases/latest/download/module.json
   ```

2. Enable **Moto’s Macro Bar** in **Manage Modules**.
3. Open **Settings → Configure Settings → Module Settings → Moto’s Macro Bar** and turn on **Enable Moto’s Macro Bar**. Each client opts in individually.

For manual installation, extract the release ZIP into Foundry’s `Data/modules` directory. The ZIP contains a top-level `motos-macro-bar` folder.

## Layouts

| Layout | Macro rows | Controls |
| --- | --- | --- |
| **2:1:2** (default) | Two left, one center, two right | Horizontal, above the center row |
| **0:5:0** | All five rows stacked in the center | Horizontal, above the stack |
| **3:2** | Three left, two right | Vertical, beside the right column |

Pages fill bottom to top within each column, starting on the left. **Reverse page order** starts with page 5. The number keys run macros from the selected Foundry hotbar page.

## Controls

The rounded control group puts **Menu**, **Show/Hide**, and **Lock** in that order.

- **Left-click the middle button** to toggle Show and Hide. Hide slides the macro rows below the screen and leaves the controls visible. Left-clicking during Auto-hide switches to Hide.
- **Right-click the middle button** to toggle Auto-hide. Hover along the screen’s bottom edge beneath the bar to reveal it. The bar stays open while your pointer is over the layout, including the gaps between slots. Turning Auto-hide off restores the previous Show or Hide mode.
- **Lock** uses Foundry’s native hotbar lock. Right-click any assigned macro to access its native context menu.

The visibility mode is saved per client. Turn off **Enable Moto’s Macro Bar** to return to Foundry’s default hotbar with your current macro assignments.

## Credits and license

Distributed under the GNU General Public License v3. The slot styling is adapted from Monk’s Hotbar Expansion by IronMonk (IronMonk108). [License](LICENSE) · [Attribution and notices](NOTICE.txt)
