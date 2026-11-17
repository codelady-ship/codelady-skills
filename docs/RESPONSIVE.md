# Responsive check (phone, tablet, desktop)

Checked on 2026-11-11 with `next dev` in MOCK mode, at widths **360, 390, 768, 1024 and 1440 px**,
in **az**, **de** (long words) and **ru**. Each page was loaded in a same-origin iframe of exactly
that width, then measured from the page itself: `scrollWidth` vs `clientWidth`, elements that stick
out past the right edge, tap targets under 44 px, and inputs with text under 16 px.
Screenshots were looked at but are not committed.

Pages: home, built-in skill (`/skills/is-muracieti` form, `/skills/seslendirme` voice tool),
library (list, filters, search dropdown, a skill with the longest description and the longest
name), my skills, add your own skill, history, sign-in, market (list, a paid skill opened with
`#id` showing Buy / Trial and the run form), test checkout, publish (paid options open), purchases,
earnings, admin (all five tabs). There are no separate voice pages: the voice tool is the
`seslendirme` skill page. Signed in with the MOCK test buyer, creator and admin.

## Before / after

| Area | Before | After |
| --- | --- | --- |
| Horizontal page scroll at 360 px | None found (all 42 page/language pairs) | Still none, at every width and language |
| Admin, purchases, earnings tables on phones | Columns squeezed to one word per line or scrolled sideways inside the table | Under 640 px each row is a card with the column name above each value (`.rtable` + `data-label`); a normal table from 640 px; dates don't wrap from 640 px |
| Navigation on phones / tablets | Only a long sideways strip of chips; account links (publish, purchases, earnings, admin, sign out) at its far end | Menu button (☰) opens a drawer with all tools, the library, my skills and the account links; it closes on a link, on Esc or on the backdrop. The chip strip stays for quick access |
| Phone header | Language and day/night buttons wrapped onto a second row under the logo, with no menu | One row: logo, a short language code (AZ / DE / RU), day/night, menu; the language list opens to the right edge so it stays on screen |
| Desktop sidebar | Sticky but taller than the screen, so the lower links could only be reached at the page end | Scrolls on its own inside the screen height |
| Tap targets | Many at 34–40 px: skill chips, library filters, language and theme buttons, paste / example buttons, admin tabs and row buttons, voice "all styles" and speed, footer links, back links | 44 px or more everywhere (text links inside sentences excepted); the desktop sidebar stays compact only with a mouse (`pointer: fine`), so touch tablets in landscape get 44 px too |
| Buttons on phones | Buy / Trial / Pay / sign-in buttons sized to their text | Full width under 640 px, normal width above |
| Input text size (iOS zoom) | Currency select 14 px, admin price / trial / payout controls 15.2 px | All inputs and selects 16 px or more |
| Long words, e-mails, links | Only some places had `break-all` | Page-wide `overflow-wrap: break-word`, `hyphens: auto` on headings, `overflow-wrap: anywhere` in table cards and the sidebar e-mail |
| Dropdowns and drawers | Fit already (search, history) | Search list, language list, history drawer and the new menu drawer all fit at 360 px |
| Sticky parts | Run button bar sticks to the bottom on phones only; no sticky header | Unchanged; nothing covers content |

## How to re-check

Start `npx next dev -p 3211`, open any `localhost:3211` page, then in the console put the page in a
360 px iframe and compare `iframe.contentDocument.documentElement.scrollWidth` with its
`clientWidth`. Chrome on Windows does not resize its window below about 500 px, so an iframe or
DevTools device mode is needed for phone widths.
