# Assets: practical next steps

## Best fit for this specific reference
Use a clean original/commissioned 2560x1440 or larger night-academy illustration, plus separate transparent floral foreground layers.
The delivered artwork is procedural vector scenery, not a high-detail painted castle image.
Do not crop the supplied full dashboard screenshot into a background: its UI/text would be embedded in the artwork.

Suggested original-art brief:
"Moonlit fantasy academy beside a lake, elegant arched stone bridge, distant Gothic-inspired spires,
subtle burgundy roses at the lower corners, deep ink-navy night, warm restrained gold window light,
soft low mist, dark negative space across the left and central upper area for readable interface content,
cinematic wide composition, clean illustration, no text, no interface, no watermark, no recognizable game characters or logos."

Ask for separated layers: sky/moon, distant architecture, bridge, water, foreground roses, optional fog.
For this CSS-only package a single optimized background plus transparent roses is sufficient.
Suggested self-imposed performance budget: about 1 MB or less for the main optimized background when feasible;
measure actual quality/network cost rather than assuming every large source image is suitable for production.

## Verified external options (not bundled)
1. Kenney game assets: https://kenney.nl/support
   Kenney states that asset-page game assets are CC0 and do not require attribution.
   Useful for UI/VFX building blocks, not a promise of a matching painterly wallpaper.
2. Kenney Particle Pack: https://kenney.nl/assets/particle-pack
   Official page lists CC0, 80 VFX assets, 512x512 tile size.
   Useful if a later JS particle layer is desired. Not downloaded into this package.
3. Live2D Cubism Web: https://www.live2d.com/en/sdk/about/
   This is a WebGL/TypeScript runtime route for actual rigged models, not a CSS effect.
   Review SDK publication terms: https://www.live2d.com/en/sdk/license/
4. Live2D samples: https://www.live2d.com/en/learn/sample/
   Use for evaluating integration only under each sample's applicable terms.
   Do NOT assume all samples are commercially usable or redistributable.
   Terms differ for original, collaboration, and externally licensed characters:
   https://www.live2d.com/eula/live2d-sample-model-terms_en.html

## Genuine Live2D later
You need a suitable licensed model, its model3.json/moc3/textures/motions as applicable,
and the official runtime/Core with the appropriate license review.
The artwork/model license and SDK publication terms are separate considerations.
This ZIP contains none of those runtime/model files and makes no claim that CSS can substitute for them.
A pre-rendered animated loop is a separate option for background motion, but needs an actual supplied/licensed video,
and is not an interactive rigged model.
