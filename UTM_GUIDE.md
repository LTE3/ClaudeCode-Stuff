# UTM tagging — La Casita BK

Tag every link you put on Instagram (and anywhere else) so we can measure
which post / ad / story actually drives RSVPs and purchases — not just clicks.

The landing page captures `utm_source`, `utm_medium`, `utm_campaign`,
`utm_content` into `page_views`, and `visitor_id` ties that click to any RSVP
or paid booking it produces. Untagged links still work — they just show up as
`(direct)` / `instagram` with no campaign, so you lose the attribution.

## The 4 tags

| Tag | What it means | Allowed values (keep tight) |
|---|---|---|
| `utm_source` | where the link lives | `ig` · `fb` · `tiktok` · `sms` · `email` |
| `utm_medium` | paid or free | `paid` (ads) · `organic` (post/story/reel) · `bio` (link in bio) · `dm` |
| `utm_campaign` | which event/push | `<event>_<MMDD>` → `badbunny_0606`, `friday_0612`, `prparade_0614` |
| `utm_content` | which creative (for A/B) | `<short>` → `reel1`, `story_swipe`, `flyer_a`, `flyer_b` |

Rules: lowercase, no spaces (use `_`), keep names short and consistent. Same
event always uses the same `utm_campaign` string so the numbers group cleanly.

## Pattern

```
https://lacasitabk.com/?utm_source=ig&utm_medium=paid&utm_campaign=<event>_<MMDD>&utm_content=<creative>
```

## Examples

Paid IG ad for the 6/6 Bad Bunny night, creative variant A:
```
https://lacasitabk.com/?utm_source=ig&utm_medium=paid&utm_campaign=badbunny_0606&utm_content=reel_a
```

Organic story for the same night:
```
https://lacasitabk.com/?utm_source=ig&utm_medium=organic&utm_campaign=badbunny_0606&utm_content=story1
```

Link in bio (evergreen):
```
https://lacasitabk.com/?utm_source=ig&utm_medium=bio&utm_campaign=evergreen
```

A/B two ad creatives for one night — same campaign, different content:
```
...&utm_campaign=friday_0612&utm_content=flyer_a
...&utm_campaign=friday_0612&utm_content=flyer_b
```

## A/B testing an ad

1. Run two creatives, identical except `utm_content` (`flyer_a` vs `flyer_b`).
2. After it runs, ask for "UTM report" — get clicks, RSVPs, and real
   click→RSVP % per `utm_content`.
3. Kill the loser, scale the winner.

## What you'll be able to ask for

- "Which campaign converted best last week?" → conversion by `utm_campaign`.
- "Paid vs organic this week?" → split by `utm_medium`.
- "Cost per real RSVP for the badbunny_0606 ad?" → ad spend ÷ tagged RSVPs.

## Tool

Open `utm-builder.html` in any browser to generate tagged links without
memorizing the format. Pick the values, copy the link.
