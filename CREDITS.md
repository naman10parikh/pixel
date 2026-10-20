# Credits

Pixel's own skills (the seven `pixel-*` skills in [`skills/`](skills/)) are written for this repository and are
licensed MIT with the rest of Pixel. The 24 skills below were written by other people. Each keeps its original
licence, and every one of those licences allows redistribution. Pixel copied them in unchanged, except for one
added line under each skill's frontmatter: a `<!-- source: ... -->` comment that names where the skill came from.

Most reached Pixel through [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates)
(MIT), a collection that republishes skills from many authors. The Origin column names the first repository we
found that published each skill. Licences were read on 20 October 2026, from each repository's licence file or
README and from the skill's own folder.

## Apache License 2.0

Each of these folders carries its own `LICENSE.txt` with the full Apache 2.0 text.

| Skill | Origin |
| --- | --- |
| [artifacts-builder](skills/artifacts-builder/) | [anthropics/skills](https://github.com/anthropics/skills) (`web-artifacts-builder`) |
| [brand-guidelines-anthropic](skills/brand-guidelines-anthropic/) | [anthropics/skills](https://github.com/anthropics/skills) (`brand-guidelines`) |
| [canvas-design](skills/canvas-design/) | [anthropics/skills](https://github.com/anthropics/skills) |
| [frontend-design](skills/frontend-design/) | [anthropics/skills](https://github.com/anthropics/skills) |
| [theme-factory](skills/theme-factory/) | [anthropics/skills](https://github.com/anthropics/skills) |
| [figma-implement-design](skills/figma-implement-design/) | [openai/skills](https://github.com/openai/skills) (`skills/.curated/figma-implement-design`) |
| [design-to-code](skills/design-to-code/) | [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates) |

## MIT License

| Skill | Origin | Copyright |
| --- | --- | --- |
| [ui-ux-pro-max](skills/ui-ux-pro-max/) | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | (c) 2024 Next Level Builder |
| [senior-frontend](skills/senior-frontend/) | [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | (c) 2025 Alireza Rezvani |
| [ui-design-system](skills/ui-design-system/) | [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | (c) 2025 Alireza Rezvani |
| [ux-researcher-designer](skills/ux-researcher-designer/) | [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | (c) 2025 Alireza Rezvani |
| [cc-skill-frontend-patterns](skills/cc-skill-frontend-patterns/) | [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) (`frontend-patterns`) | (c) 2026 Affaan Mustafa |
| [frontend-dev-guidelines](skills/frontend-dev-guidelines/) | [diet103/claude-code-infrastructure-showcase](https://github.com/diet103/claude-code-infrastructure-showcase) | (c) 2025 Claude Code Infrastructure Contributors |
| [tailwind-design-system](skills/tailwind-design-system/) | [wshobson/agents](https://github.com/wshobson/agents) | (c) 2024 Seth Hobson |
| [web-design-guidelines](skills/web-design-guidelines/) | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (MIT, stated in its README) | Vercel |
| [shadcn](skills/shadcn/) | [shadcn-ui/ui](https://github.com/shadcn-ui/ui) (`skills/shadcn`) | (c) 2023 shadcn |
| [mobile-design](skills/mobile-design/) | [vudovn/antigravity-kit](https://github.com/vudovn/antigravity-kit) | (c) 2026 VUDOVN |
| [tailwind-patterns](skills/tailwind-patterns/) | [vudovn/antigravity-kit](https://github.com/vudovn/antigravity-kit) | (c) 2026 VUDOVN |
| [design-system-starter](skills/design-system-starter/) | [softaworks/agent-toolkit](https://github.com/softaworks/agent-toolkit) | (c) 2026 Leonardo Flores |
| [design-mirror](skills/design-mirror/) | [brightdata/skills](https://github.com/brightdata/skills) | (c) 2025 Bright Data |
| [feature-design-assistant](skills/feature-design-assistant/) | notedit, in [notedit/happy-skills](https://github.com/notedit/happy-skills) (MIT; the skill has since left that repository) | (c) 2025 leeoxiang |
| [accessibility-auditor](skills/accessibility-auditor/) | [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates) (no earlier source found) | (c) 2025 Daniel (San) Ávila |
| [premium-web-design](skills/premium-web-design/) | [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates) (no earlier source found) | (c) 2025 Daniel (San) Ávila |
| [motion-canvas](skills/motion-canvas/) | [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates) (its frontmatter says `license: MIT`, author motion-canvas) | (c) 2025 Daniel (San) Ávila |

The MIT permission notice, which applies to each copyright line above:

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
> documentation files (the "Software"), to deal in the Software without restriction, including without limitation
> the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
> permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of
> the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
> WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
> COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
> OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Tools Pixel runs but does not ship

The ship gate calls [impeccable](https://www.npmjs.com/package/impeccable), axe, Lighthouse CI and the shadcn CLI
through `npx` at run time. None of them is copied into this repository.
