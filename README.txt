Moto's Macro Bar 1.0.2

A standalone Foundry VTT module by Moto. Displays all five macro pages in a
fixed layout that shrinks to fit between the player list and the sidebar.
Targets Foundry VTT 13.351. Optional compatibility: Carolingian UI 2.31.6.
No Monk's Hotbar Expansion dependency. No system-specific dependencies.

INSTALL / SWITCH FROM THE OLD MODULES
1. Extract motos-macro-bar.zip into your Foundry user-data modules directory.
   Confirm modules/motos-macro-bar/module.json exists.
2. Restart Foundry if needed to discover the module.
3. Disable Monk's Hotbar Expansion and Responsive Monk's Hotbar in this world.
   Keep Carolingian UI enabled if you use it.
4. Enable Moto's Macro Bar and reload the world.
5. Configure Settings > Module Settings > Moto's Macro Bar:
   Turn on Enable Moto's Macro Bar for each client that wants it.

The client master switch defaults to OFF. When off, Foundry's normal hotbar
is shown, including any Carolingian styling. Existing macro assignments remain
intact: this module uses the same 50 user hotbar slots and does not migrate or
rewrite them. Old companion layout settings are not automatically imported.

If Monk's or the old companion remains enabled, Moto's stays inactive and shows
a warning instead of competing for control of the hotbar.

SETTINGS
Enable Moto's Macro Bar: client-only, default off. Applies without a reload.
Expanded hotbar layout: client-only, default 2:1:2.
  2:1:2 - two bars left, one in the center, two right.
  0:5:0 - all five stacked in one centered column, without empty side columns.
  3:2   - three bars left, two right.
Reverse page order: client-only, default off.

The layout remains fixed as available width changes. All icons, labels, gaps,
and controls shrink together to fit, returning toward normal size when space
increases. They are never enlarged beyond their normal size. Very narrow space
necessarily produces small controls. Base gaps between bars are 2 CSS pixels.

Pages fill from the bottom upward in the leftmost column, then continue in the
next column. Reverse page order starts with page 5 instead of page 1.

CONTROLS
Uses Foundry's native macro execution, drag/drop, lock, right-click menu, and
keyboard shortcuts. The global page arrows and page-number display are hidden
without reserving space while Moto's is enabled. Number keys still execute the selected page.
Changing the active keyboard page does not rearrange the visual page order.
Per-page trash buttons and number-selector rails are omitted.
The current-page clear-all button is hidden in the expanded layout; use the
native right-click menu to remove individual macros.

When Carolingian adds its far-right hide-all button, Moto's uses that control and
corrects the collapse distance for the full scaled height. Otherwise Moto's
provides its own far-right auto-hide button. Both leave a small reveal strip;
hover to reveal the bar and use the arrow again to keep it visible.
Moto's own auto-hide preference is stored per client.

Notification Pip mode reclaims the empty side notification area. Chat Cards
reserves that space only when Foundry's notification log is enabled/visible.

DISABLE / REMOVE
Turn off the client master switch to restore the original hotbar immediately.
Or disable the module in Manage Modules and reload. Macro assignments and other
modules' settings are unchanged. The old companion package remains separate.

CREDITS / LICENSE
Includes macro-slot styling adapted from Monk's Hotbar Expansion 13.01 by
IronMonk (IronMonk108). Thank you for the original expanded-hotbar work.
See NOTICE.txt for attribution and modification details, and LICENSE for the
GNU GPL version 3. This archive includes the complete editable source.
Carolingian UI is an optional independent module; no affiliation is implied.

VALIDATION
Browser geometry checks with Foundry's CSS, with and without Carolingian's actual
stylesheet, cover all layouts, several widths/scales, repeated resizing, master
switch cleanup, sidebar notification modes, and full-height hide/reveal.
Interaction checks execute the supplied Foundry 13.351 Hotbar and DragDrop code
in an isolated browser harness with Moto's page builder and no Monk's module.
They cover all 50 slots, macro execution, empty-slot creation, cross-page drag
and drop, lock enforcement, right-click removal, re-rendering, client disable/
enable, reverse ordering, hide-button coexistence, and conflicting-module guard.
These are controlled tests, not a full running-world test of every other module.

MAINTENANCE IN 1.0.2
Removed obsolete Monk-only control rules and page-collapse handling. Disabling
the client switch now disconnects both observers, removes the resize listener,
and cancels pending layout work. While enabled, unrelated chat/document content
changes are filtered out instead of recalculating the bar. End-control dimensions
are observed directly, and body/interface scale changes remain supported.
Shared the settings refresh path and simplified layout geometry calculations.
The browser geometry harness now uses Moto's real page builder and hide-control
code, and checks monitoring shutdown/restart and unrelated chat mutations.
