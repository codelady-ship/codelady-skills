# Free skills and free background removal: research (2026-11-10)

Data source for the site: `src/skills/curated.json` (80 skills, 14 categories). Star counts and push dates were read from the GitHub API on 2026-11-10.

## 1. How the skills were selected

1. **Where I looked.** I read anthropics/skills and the other Anthropic repos (knowledge-work-plugins, claude-for-legal, k12-teacher-skills, financial-services). I also read obra/superpowers and coreyhaines31/marketingskills, plus five awesome lists: ComposioHQ, VoltAgent, travisvn, BehiSecc and karanb192. Between them the lists link to about 750 repos. I added targeted `gh search repos` queries for every category (resume, tutor, trading, legal, Instagram, TikTok, Facebook, SEO, UI/UX, interior design and others) and one `gh search code` query for interior-design SKILL.md files.
2. **What I scanned.** For about 90 candidate repos I fetched the repo metadata and the full git tree. That gave the stars, the SPDX licence, the last push date, the default branch, every SKILL.md with its size, and how many script files sit next to it.
3. **Filters, all applied:**
   - **Stars:** 500+ preferred. In niche categories (education, finance, social media) I took the best available.
   - **Activity:** pushed in 2026. Every pick passes this check.
   - **Licence:** MIT, Apache-2.0, BSD, ISC, CC0 or CC-BY-4.0. A repo with no licence, NOASSERTION or a non-commercial licence was excluded. For anthropics/skills, which has no repo-level licence, I checked the LICENSE.txt in each skill folder: the picked skills are Apache-2.0.
   - **Substance:** I read every picked SKILL.md (frontmatter plus body). Stubs, redirects and files that only point to other files were dropped.
   - **Text-only fit:** the site has no code execution, no uploads and no MCP. I counted references to `python`, `scripts/`, `npx`, `mcp__` and `curl` in each body and read the workflow. A skill that cannot do its main job without running code is marked `"runnable": false`. Only 6 of the 80 are marked that way, and they were kept because they are top-tier and useful as "install in your own Claude" links.
   - **Finance:** only education, analysis and journaling skills. All are marked `"disclaimer": true`. Nothing that places orders or promises returns.
4. **Limits:** at most 8 skills per category, no duplicates (each id is unique), sorted by category and then by stars.

> Note: the `stars` field is the star count of the **repo** the skill lives in, not of the single skill.

## 2. Picks per category

### Design & images

| Name | Repo | Stars | Licence | Runs as text | Why |
|---|---|---:|---|---|---|
| theme-factory | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/theme-factory) | 191,969 | Apache-2.0 | yes | Ten tested colour and font themes plus on-the-fly theme generation for any page, slide or doc. |
| diagram-design | [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design/tree/main/skills/diagram-design) | 66,274 | MIT | yes | Editorial-quality diagrams (flowcharts, timelines, org charts, Venn) output as clean self-contained SVG/HTML. |
| image | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/image) | 59,553 | MIT | yes | Picks generate vs design vs photograph and writes ready image-model prompts for heroes, social and OG images. |
| design-critique | [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins/tree/main/design/skills/design-critique) | 35,323 | Apache-2.0 | yes | Anthropic's structured critique of usability, hierarchy and consistency for a described or pasted design. |
| color-expert | [meodai/skill.color-expert](https://github.com/meodai/skill.color-expert/tree/main/) | 644 | CC-BY-4.0 | yes | Deep colour-science reference (OKLCH, harmony, contrast) that turns vague colour asks into precise palettes. |

### Marketing & social

| Name | Repo | Stars | Licence | Runs as text | Why |
|---|---|---:|---|---|---|
| copywriting | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/copywriting) | 59,553 | MIT | yes | From the most-starred marketing skill set; diagnoses the brief first and refuses unsupported claims. |
| ad-creative | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/ad-creative) | 59,553 | MIT | yes | Writes and judges ad headlines and angles per platform with testable hypotheses. |
| content-strategy | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/content-strategy) | 59,553 | MIT | yes | Turns a business into topic clusters and an editorial calendar tied to customers and search. |
| marketing-psychology | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/marketing-psychology) | 59,553 | MIT | yes | Explains buyer biases and mental models with an honesty check on each tactic. |
| pricing | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/pricing) | 59,553 | MIT | yes | Practical pricing and packaging playbook: tiers, value metrics, freemium, price rises. |

### Social media management

| Name | Repo | Stars | Licence | Runs as text | Why |
|---|---|---:|---|---|---|
| social | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/social) | 59,553 | MIT | yes | Cross-platform organic social (LinkedIn, X, Instagram, TikTok, Facebook) with calendars and no AI tells. |
| linkedin-post-writer | [sergebulaev/linkedin-skills](https://github.com/sergebulaev/linkedin-skills/tree/main/skills/linkedin-post-writer) | 5,804 | MIT | yes | Most-starred LinkedIn skill set: 20 hook formulas picked by goal plus a humanizer pass. |
| ig-dm | [Jakeschincariol/instagram-agent-skill](https://github.com/Jakeschincariol/instagram-agent-skill/tree/main/skills/ig-dm) | 5,777 | MIT | yes | Instagram DM replies, keyword deliveries, collab pitches and follow-ups that get answers. |
| ig-audit | [Jakeschincariol/instagram-agent-skill](https://github.com/Jakeschincariol/instagram-agent-skill/tree/main/skills/ig-audit) | 5,777 | MIT | yes | Reads pasted Instagram insights and says what worked, why, and what to stop posting. |
| ig-content-planner | [sergebulaev/instagram-skills](https://github.com/sergebulaev/instagram-skills/tree/main/skills/ig-content-planner) | 803 | MIT | yes | Weekly Instagram plan mixing Reels, carousels and stories with hooks, times and goals. |
| ig-caption-writer | [sergebulaev/instagram-skills](https://github.com/sergebulaev/instagram-skills/tree/main/skills/ig-caption-writer) | 803 | MIT | yes | Instagram captions with the hook in the first 125 characters and one clear CTA. |
| ig-hashtag-strategist | [sergebulaev/instagram-skills](https://github.com/sergebulaev/instagram-skills/tree/main/skills/ig-hashtag-strategist) | 803 | MIT | yes | Sized 3-5 hashtag sets (niche/mid/broad) that small accounts can actually rank in. |
| fb-page-optimizer | [sergebulaev/facebook-skills](https://github.com/sergebulaev/facebook-skills/tree/main/skills/fb-page-optimizer) | 147 | MIT | yes | Full Facebook Page audit and rewrite: name, about, CTA button, pinned post, tabs. |

### Writing & content

| Name | Repo | Stars | Licence | Runs as text | Why |
|---|---|---:|---|---|---|
| humanizer | [blader/humanizer](https://github.com/blader/humanizer/tree/main/) | 67,435 | MIT | yes | The most-starred writing skill; removes AI tells while keeping the meaning. |
| copy-editing | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/copy-editing) | 59,553 | MIT | yes | Line-by-line editing and proofreading without rewriting from scratch. |
| sepia | [Nanako0129/sepia](https://github.com/Nanako0129/sepia/tree/main/skills/sepia) | 3,766 | MIT | yes | Research-backed de-AI rewriting for fiction and professional prose, routed by genre. |
| plain-writing | [docwriter-org/plain-writing-skill](https://github.com/docwriter-org/plain-writing-skill/tree/main/skills/plain-writing) | 743 | MIT | yes | Plain-language style for reports, emails and docs: everyday words, no jargon. |

### Career & jobs

| Name | Repo | Stars | Licence | Runs as text | Why |
|---|---|---:|---|---|---|
| career-ops | [career-ops-hq/career-ops](https://github.com/career-ops-hq/career-ops/tree/main/.agents/skills/career-ops) | 81,647 | MIT | no | Hugely popular job-search agent (scoring, CV PDFs, portal scans) but needs local files and scripts. |
| resume-tailor | [Paramchoudhary/ResumeSkills](https://github.com/Paramchoudhary/ResumeSkills/tree/main/skills/resume-tailor) | 3,116 | MIT | yes | Tailors a CV to a specific job ad while staying truthful. |
| resume-bullet-writer | [Paramchoudhary/ResumeSkills](https://github.com/Paramchoudhary/ResumeSkills/tree/main/skills/resume-bullet-writer) | 3,116 | MIT | yes | Turns weak CV bullets into achievement statements with metrics. |
| cover-letter-generator | [Paramchoudhary/ResumeSkills](https://github.com/Paramchoudhary/ResumeSkills/tree/main/skills/cover-letter-generator) | 3,116 | MIT | yes | Personal cover letters built from the CV and the job description. |
| interview-prep-generator | [Paramchoudhary/ResumeSkills](https://github.com/Paramchoudhary/ResumeSkills/tree/main/skills/interview-prep-generator) | 3,116 | MIT | yes | STAR stories, likely questions and talking points from your own CV. |

### Education & study

| Name | Repo | Stars | Licence | Runs as text | Why |
|---|---|---:|---|---|---|
| teach | [mattpocock/skills](https://github.com/mattpocock/skills/tree/main/skills/productivity/teach) | 320,566 | MIT | no | Excellent multi-session teaching method, but it keeps lessons as files in a workspace. |
| socratic-drill | [anthropics/claude-for-legal](https://github.com/anthropics/claude-for-legal/tree/main/law-student/skills/socratic-drill) | 9,967 | Apache-2.0 | yes | Socratic quiz mode that withholds answers until the learner reasons it out; works for any subject. |
| k12-lesson-plan-creation | [anthropics/k12-teacher-skills](https://github.com/anthropics/k12-teacher-skills/tree/main/plugin/skills/k12-lesson-plan-creation) | 623 | Apache-2.0 | yes | Anthropic + Learning Commons lesson plans with student materials, built with eval rubrics. |
| k12-check-for-understanding | [anthropics/k12-teacher-skills](https://github.com/anthropics/k12-teacher-skills/tree/main/plugin/skills/k12-check-for-understanding) | 623 | Apache-2.0 | yes | Quick checks whose wrong answers map to known misconceptions and next teaching steps. |
| k12-lesson-differentiation | [anthropics/k12-teacher-skills](https://github.com/anthropics/k12-teacher-skills/tree/main/plugin/skills/k12-lesson-differentiation) | 623 | Apache-2.0 | yes | Adapts one lesson for below, at and above grade-level learners. |
| learn-anything-skill | [read2017/learn-anything-with-AI](https://github.com/read2017/learn-anything-with-AI/tree/main/skills/learn-anything-skill) | 205 | MIT | yes | Project-driven mastery-learning coach: study plan, notes review and mastery checks. |

### Coding & dev

| Name | Repo | Stars | Licence | Runs as text | Why |
|---|---|---:|---|---|---|
| brainstorming | [obra/superpowers](https://github.com/obra/superpowers/tree/main/skills/brainstorming) | 315,542 | MIT | yes | From the most-starred skills framework; turns a rough idea into an agreed design through questions. |
| systematic-debugging | [obra/superpowers](https://github.com/obra/superpowers/tree/main/skills/systematic-debugging) | 315,542 | MIT | yes | Root-cause-first debugging method that stops guess-and-patch fixes. |
| code-review-and-quality | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/main/skills/code-review-and-quality) | 114,930 | MIT | yes | Multi-axis code review (correctness, design, security, tests) by Addy Osmani. |
| security-and-hardening | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening) | 114,930 | MIT | yes | OWASP-based security review of auth, input handling and data storage. |
| spec-driven-development | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/main/skills/spec-driven-development) | 114,930 | MIT | yes | Writes a clear spec/PRD before any code is written. |

### Data & spreadsheets

| Name | Repo | Stars | Licence | Runs as text | Why |
|---|---|---:|---|---|---|
| sql-queries | [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins/tree/main/data/skills/sql-queries) | 35,323 | Apache-2.0 | yes | Anthropic's SQL guide across Postgres, BigQuery, Snowflake and more, with CTEs and window functions. |
| explore-data | [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins/tree/main/data/skills/explore-data) | 35,323 | Apache-2.0 | yes | Profiles a pasted table: nulls, distributions, duplicates and what to analyse next. |
| statistical-analysis | [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins/tree/main/data/skills/statistical-analysis) | 35,323 | Apache-2.0 | yes | Explains and applies descriptive stats, trends, outliers and significance tests. |
| ab-test-analysis | [phuryn/pm-skills](https://github.com/phuryn/pm-skills/tree/main/pm-data-analytics/skills/ab-test-analysis) | 27,840 | MIT | yes | A/B test verdicts with significance, sample-size checks and ship/stop advice. |
| cohort-analysis | [phuryn/pm-skills](https://github.com/phuryn/pm-skills/tree/main/pm-data-analytics/skills/cohort-analysis) | 27,840 | MIT | yes | Retention and adoption cohort analysis with plain-language insights. |

### Video & audio

| Name | Repo | Stars | Licence | Runs as text | Why |
|---|---|---:|---|---|---|
| hyperframes | [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes/tree/main/skills/hyperframes) | 82,127 | Apache-2.0 | no | HeyGen's HTML-to-video skill; top quality but it renders MP4 with a local CLI. |
| video | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/video) | 59,553 | MIT | yes | Chooses the right video approach (screen recording, AI avatar, generated) and plans it. |
| ig-reel | [Jakeschincariol/instagram-agent-skill](https://github.com/Jakeschincariol/instagram-agent-skill/tree/main/skills/ig-reel) | 5,777 | MIT | yes | Reel script with hook options, spoken lines, on-screen text and a timed beat sheet. |
| yt-script | [Jakeschincariol/youtube-agent-skill](https://github.com/Jakeschincariol/youtube-agent-skill/tree/main/skills/yt-script) | 5,410 | MIT | yes | YouTube script with scored hooks and retention beats marked on screen. |
| yt-package | [Jakeschincariol/youtube-agent-skill](https://github.com/Jakeschincariol/youtube-agent-skill/tree/main/skills/yt-package) | 5,410 | MIT | yes | Title and thumbnail text written and checked as one package. |
| tt-hook-scripter | [sergebulaev/tiktok-skills](https://github.com/sergebulaev/tiktok-skills/tree/main/skills/tt-hook-scripter) | 122 | MIT | yes | First 1-3 second TikTok hook: spoken line, on-screen text and opening visual together. |

### Productivity & docs

| Name | Repo | Stars | Licence | Runs as text | Why |
|---|---|---:|---|---|---|
| grilling | [mattpocock/skills](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling) | 320,566 | MIT | yes | Stress-tests a plan or decision with relentless questions before you commit. |
| i-have-adhd | [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd/tree/main/skills/i-have-adhd) | 60,746 | MIT | yes | ADHD-friendly answers: next action first, numbered steps, real time estimates. |
| process-doc | [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins/tree/main/operations/skills/process-doc) | 35,323 | Apache-2.0 | yes | Documents a process as an SOP with a RACI and edge cases. |
| summarize-meeting | [phuryn/pm-skills](https://github.com/phuryn/pm-skills/tree/main/pm-execution/skills/summarize-meeting) | 27,840 | MIT | yes | Turns a pasted transcript into notes with decisions and action items. |
| prompt-master | [nidhinjs/prompt-master](https://github.com/nidhinjs/prompt-master/tree/main/) | 15,788 | MIT | yes | Writes precise prompts for any AI tool (ChatGPT, Midjourney, video AI, coding agents). |

### Finance & trading

| Name | Repo | Stars | Licence | Runs as text | Why |
|---|---|---:|---|---|---|
| backtest-expert | [tradermonty/claude-trading-skills](https://github.com/tradermonty/claude-trading-skills/tree/main/skills/backtest-expert) | 3,735 | MIT | yes | Backtest-plan checklist: robustness, slippage and bias traps explained before any money is risked. |
| position-sizing | [agiprolabs/claude-trading-skills](https://github.com/agiprolabs/claude-trading-skills/tree/main/skills/position-sizing) | 521 | MIT | yes | Explains fixed-fractional, volatility and Kelly sizing with worked formulas. |
| risk-management | [agiprolabs/claude-trading-skills](https://github.com/agiprolabs/claude-trading-skills/tree/main/skills/risk-management) | 521 | MIT | yes | Drawdown limits, exposure caps and circuit-breaker rules explained. |
| trade-journal | [agiprolabs/claude-trading-skills](https://github.com/agiprolabs/claude-trading-skills/tree/main/skills/trade-journal) | 521 | MIT | yes | Trading-journal structure, review routine and behaviour-pattern checks. |
| exit-strategies | [agiprolabs/claude-trading-skills](https://github.com/agiprolabs/claude-trading-skills/tree/main/skills/exit-strategies) | 521 | MIT | yes | Stop-loss, take-profit and trailing-stop methods compared. |
| charlie | [EveryInc/charlie-cfo-skill](https://github.com/EveryInc/charlie-cfo-skill/tree/main/) | 330 | MIT | yes | Munger-style CFO for small businesses: runway, burn, unit economics, cash discipline. |

### Research

| Name | Repo | Stars | Licence | Runs as text | Why |
|---|---|---:|---|---|---|
| last30days | [mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill/tree/main/skills/last30days) | 67,208 | MIT | no | Very popular "what people said in the last 30 days" research, but it runs fetch scripts. |
| scientific-critical-thinking | [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/scientific-critical-thinking) | 56,713 | MIT | yes | Grades evidence quality, bias and statistical claims (GRADE, Cochrane) from the top science skills library. |
| synthesize-research | [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins/tree/main/product-management/skills/synthesize-research) | 35,323 | Apache-2.0 | yes | Turns interview notes, surveys and feedback into ranked themes and insights. |
| market-sizing | [phuryn/pm-skills](https://github.com/phuryn/pm-skills/tree/main/pm-market-research/skills/market-sizing) | 27,840 | MIT | yes | TAM/SAM/SOM estimates top-down and bottom-up with stated assumptions. |
| research-paper-writing | [Master-cai/Research-Paper-Writing-Skills](https://github.com/Master-cai/Research-Paper-Writing-Skills/tree/main/research-paper-writing) | 8,238 | MIT | yes | Section-by-section academic paper writing advice adapted from a professor's guide. |
| research | [Weizhena/Deep-Research-skills](https://github.com/Weizhena/Deep-Research-skills/tree/master/skills/research-en/research) | 2,527 | MIT | yes | Human-in-the-loop research outline before a deep dive; pairs well with web search. |

### Legal & business

| Name | Repo | Stars | Licence | Runs as text | Why |
|---|---|---:|---|---|---|
| triage-nda | [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins/tree/main/legal/skills/triage-nda) | 35,323 | Apache-2.0 | yes | Anthropic's NDA triage into GREEN/YELLOW/RED with the clauses that matter. |
| review-contract | [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins/tree/main/legal/skills/review-contract) | 35,323 | Apache-2.0 | yes | Clause-by-clause contract review with redline suggestions and business impact. |
| legal-risk-assessment | [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins/tree/main/legal/skills/legal-risk-assessment) | 35,323 | Apache-2.0 | yes | Severity-by-likelihood legal risk scoring with clear escalation rules. |
| swot-analysis | [phuryn/pm-skills](https://github.com/phuryn/pm-skills/tree/main/pm-product-strategy/skills/swot-analysis) | 27,840 | MIT | yes | SWOT with an action for each quadrant, not just a list. |
| privacy-policy | [phuryn/pm-skills](https://github.com/phuryn/pm-skills/tree/main/pm-toolkit/skills/privacy-policy) | 27,840 | MIT | yes | Drafts a GDPR-aware privacy policy and marks clauses that need a lawyer. |
| marketing-claims-review | [anthropics/claude-for-legal](https://github.com/anthropics/claude-for-legal/tree/main/product-legal/skills/marketing-claims-review) | 9,967 | Apache-2.0 | yes | Flags ad and landing-page claims that need proof, rewording or cutting. |

### Website building

| Name | Repo | Stars | Licence | Runs as text | Why |
|---|---|---:|---|---|---|
| frontend-design | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | 191,969 | Apache-2.0 | yes | Anthropic's official skill for distinctive, non-templated page design and typography. |
| ui-ux-pro-max | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/main/.claude/skills/ui-ux-pro-max) | 147,682 | MIT | no | Most-starred UI/UX skill; its style and palette database is queried with a Python script. |
| impeccable | [pbakaus/impeccable](https://github.com/pbakaus/impeccable/tree/main/.claude/skills/impeccable) | 107,373 | Apache-2.0 | no | Top design vocabulary for agents (critique, polish, audit) but relies on its bundled CLI. |
| site-architecture | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/site-architecture) | 59,553 | MIT | yes | Plans pages, navigation, URLs and internal links before building. |
| seo-audit | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/main/skills/seo-audit) | 59,553 | MIT | yes | Technical and on-page SEO audit, indexing and Core Web Vitals diagnosis. |
| emil-design-eng | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/main/skills/emil-design-eng) | 55,706 | MIT | yes | Emil Kowalski's (Sonner, Vaul) UI polish and animation judgement. |
| ux-copy | [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins/tree/main/design/skills/ux-copy) | 35,323 | Apache-2.0 | yes | Microcopy for buttons, errors, empty states and onboarding. |
| better-accessibility | [jakubkrehel/skills](https://github.com/jakubkrehel/skills/tree/main/skills/better-accessibility) | 11,917 | MIT | yes | WCAG 2.2 review and fixes for keyboard, focus, ARIA, forms and motion. |

### Interior & architecture

**No picks.** This category has no skill that meets the bar. See section 4.

## 3. What was rejected and why (short)

| Rejected | Reason |
|---|---|
| anthropics/skills `docx`, `pdf`, `pptx`, `xlsx`, `slack-gif-creator`, `webapp-testing`, `mcp-builder` | They exist to make or edit files with code (8–15 scripts each). The site cannot run them. |
| anthropics/skills `doc-coauthoring` | No LICENSE file in its folder, and the repo has no licence. |
| anthropics/skills `internal-comms` | 1.5 KB stub. All of its content lives in example files the site cannot load. |
| anthropics/skills `brand-guidelines`, `academy-guide`, `discernment-nudge` | Anthropic-specific, or a meta behaviour rather than a task. |
| vercel-labs/agent-skills (`web-design-guidelines`, `react-best-practices`, `deploy-to-vercel`) | Repo has no licence. Also, `web-design-guidelines` only fetches a remote rules file. |
| deanpeters/Product-Manager-Skills (7.9k★) | CC BY-NC-SA 4.0, which is non-commercial. |
| Imbad0202/academic-research-skills (56k★) | CC BY-NC 4.0, which is non-commercial. |
| GarethManning/education-agent-skills | CC BY-SA 4.0. Share-alike is not on the allowed list. |
| ComposioHQ / travisvn / BehiSecc awesome lists, irinabuht12-oss/marketing-skills, BrianRWagner marketing skills, SHADOWPR0/beautiful_prose, jennifer88huang/interview-skills, aiwithremy/llm-council | No licence. |
| op7418 PPT/video skills, OpenMontage | AGPL-3.0. |
| lawve-ai/awesome-legal-skills, borghei/Claude-Skills, Motionsites-AI | Licence is "other"/NOASSERTION. |
| anthropics/financial-services (DCF, LBO, comps) | Apache, but the output is Excel/PowerPoint built with code, and the audience is bankers. |
| tradermonty `technical-analyst`, `position-sizer`, `options-strategy-advisor`, screeners | Need chart images or Python scripts. Screeners and "recommended stocks" outputs also fall outside the education-only rule. |
| Jakeschincariol/trader-skill, day-trader-skill, ryanfrigo/kalshi bot, Hyperliquid/Krexa skills | They place or prepare real orders. Excluded by the finance rule. |
| Leonxlnx/taste-skill (113k★), heydamir/unslop (13k★, CC-BY-4.0) | Excellent, but every step runs bundled Node scripts. Listed as alternatives for the "install in your Claude" panel only. |
| K-Dense `literature-review`, `scientific-writing` | Built around PubMed/arXiv API scripts and local checks. |
| charlie947 `reels-scripting`, blacktwist `performance-analyzer-sms` | Depend on Apify/Gemini or the BlackTwist API. |
| haowjy/creative-writing-skills | 1–2 KB fragments of a larger agent workflow, not usable alone. |
| curiositech/some_claude_skills `interior-design-expert`, `fancy-yard-landscaper` | 265★ repo with about 200 mass-produced skills. The interior skill is 7.8 KB, assumes Stability AI MCP renders and contains no real layout rules. Too weak for the bar. |
| tomatoparkdao/omniailab-ai-architect | 107★, Chinese only, and needs DXF/3D tooling (61 tool references). |
| alirezarezvani/claude-skills, sickn33/agentic-awesome-skills, lionelsimai collection | Huge aggregators (400–10,000 skills) of uneven quality. Better originals exist for every slot. |

## 4. Gaps: skills we should write ourselves

These are areas where no free skill is good enough, or where only some of the need is covered. Each one is a candidate for our own skill.

### 4.1 `room-planner` (Interior & architecture)
**Purpose:** plan one room or a whole apartment from its measurements: layout, furniture, colours and lighting, plus a renovation budget.
- Asks for room size, door and window positions, ceiling height, budget, style and who lives there. Returns a text floor plan with a dimensioned furniture list.
- Checks clearances and circulation: walkways of 90 cm or more, bed side clearance, kitchen work triangle, sofa-to-TV distance by screen size.
- Picks a palette with the 60-30-10 rule and three real paint-colour options in hex. Checks contrast for accessibility.
- Lighting plan in three layers (ambient, task, accent) with lux targets per room and colour temperature in kelvin.
- Mood board as text: style keywords, materials and textures, plus ready-made prompts for free image models.
- Renovation plan: order of trades, a cost table with a contingency line, and a checklist of when a licensed professional or a permit is needed.
- Small-flat tips for Baku-style apartments: storage, multifunctional furniture, balcony use.

**Sources:** Neufert *Architects' Data* (dimensions and clearances), the NKBA Kitchen & Bath Planning Guidelines, the IES Lighting Handbook / EN 12464-1 lux tables, the WCAG 2.2 contrast formula, ADA 2010 Standards (accessible clearances), and local building rules (AZ: Şəhərsalma və Tikinti Məcəlləsi).

### 4.2 `facade-and-garden` (Interior & architecture)
**Purpose:** ideas for a house exterior or facade and a small garden or yard.
- Facade style options matched to the house type and climate. Material pairs with maintenance notes.
- Exterior colour schemes that respect local context and any HOA or municipal rules.
- Garden zoning: entry, sitting, play, utility. Plant lists by climate zone and sun or shade, with mature sizes.
- Hardscape sizing for paths, terraces and steps (rise/run).
- A low-water garden option for dry climates.
- A seasonal maintenance calendar and phased budget.
- Image-model prompts for before/after concepts.

**Sources:** the RHS plant finder, USDA/Köppen climate zones, Neufert (stairs and paths), and local planning or heritage rules.

### 4.3 `instagram-manager` (Social media management, end to end)
The existing picks cover single tasks well: planner, captions, hashtags, DMs and audit. None ties them into one monthly loop for an ordinary account, and analytics review only works by pasting numbers in.
- Profile audit with a score: bio, name keyword, highlights, first-9 grid.
- A 30-day calendar built on 3–4 content pillars, mixing Reels, carousels and stories.
- Per post: hook, caption, 3–5 sized hashtags, alt text and CTA.
- Reels scripts with on-screen text and a shot list. TikTok, LinkedIn and Facebook variants of the same idea.
- DM and comment reply templates, including "price?" and collab requests, in AZ/RU/EN.
- Monthly analytics review from pasted Insights numbers: reach, saves, shares, follows per post. Says what to repeat and what to stop.
- A growth plan that refuses follow/unfollow tricks and bought engagement.

**Sources:** Instagram's official creators site (creators.instagram.com) and the Adam Mosseri ranking explainers, the Meta Business Help Centre (Insights definitions), Instagram Community Guidelines, TikTok Creator Academy, LinkedIn's and Meta's Page help centres.

### 4.4 `podcast-and-voiceover-script` (Video & audio)
Audio is the weakest part of Video & audio. Most free audio skills call paid TTS APIs.
- Podcast episode outline, intro and outro, segment timings and show notes.
- Interview question sets with follow-ups.
- Voiceover scripts timed at 130–150 wpm, with pauses and emphasis marked.
- A plain-speech pass: numbers and abbreviations written out (as in our own azerbaijani-voiceover-studio).
- Chapter markers and an episode description for Spotify and YouTube.
- Prompts for free TTS tools, and an AI-voice disclosure line.

**Sources:** Apple Podcasts and Spotify for Creators metadata guidelines, the YouTube chapters help page, and EBU R128 / -16 LUFS loudness guidance (for the notes only).

### 4.5 `sheets-formula-coach` (Data & spreadsheets)
Anthropic's `xlsx` skill needs code. No good text-only Excel/Google Sheets skill exists.
- Turns a plain request into an Excel and a Google Sheets formula: XLOOKUP, FILTER, QUERY, SUMIFS, pivots.
- Explains the formula piece by piece.
- Fixes a pasted broken formula (#N/A, #REF!, wrong ranges).
- Layout advice: one table per sheet, data validation, named ranges.
- Templates for a budget, an invoice tracker and a study timetable.
- Notes on locale differences, such as `;` vs `,` separators in AZ/RU locales.

**Sources:** the Microsoft Support Excel functions reference and the Google Docs Editors Help function list.

## 5. Free background removal in the browser

### Comparison

| Option | Code licence | Weights licence | Commercial use | Download (ONNX) | Quality / notes |
|---|---|---|---|---|---|
| **Transformers.js + BiRefNet_lite** (`onnx-community/BiRefNet_lite-ONNX`) | Apache-2.0 | **MIT** | **Yes** | fp16 ≈ **115 MB**, fp32 ≈ 224 MB | Strong general quality (people, products, objects) at 1024 px. WebGPU: about 1 s. WASM: several seconds. |
| Transformers.js + BEN2 base (`onnx-community/BEN2-ONNX`) | Apache-2.0 | MIT (base model; the "full" BEN2 is commercial) | Yes | fp16 ≈ 219 MB | Very good hair and edges. Best quality per MB if 219 MB is acceptable. |
| Transformers.js + full BiRefNet (`onnx-community/BiRefNet-ONNX`) | Apache-2.0 | MIT | Yes | fp16 ≈ 490 MB | Best open quality, but too heavy for most visitors. |
| Transformers.js + MODNet (`Xenova/modnet`) | Apache-2.0 | Apache-2.0 | Yes | q8 ≈ **6.6 MB** | Portraits and people only. Tiny and fast. This is the pipeline's default model. |
| briaai RMBG-1.4 | – | bria-rmbg-1.4, **non-commercial** | No (paid licence needed) | q8 44 MB | Good, but not usable for free commercially. |
| briaai RMBG-2.0 | – | **CC BY-NC 4.0**, gated | No | ≥ 234 MB | Top quality, but non-commercial. |
| `@imgly/background-removal` 1.7.0 | **AGPL-3.0** (paid commercial licence from IMG.LY) | ISNet-based | Only if our site's source is AGPL, or with a paid licence | 40–170 MB | Easiest API, but the copyleft makes it unsafe for us. |
| onnx-community/ISNet-ONNX | – | tagged AGPL-3.0 on HF | Risky | 44–176 MB | Avoid. |
| MediaPipe selfie / image segmenter (`@mediapipe/tasks-vision`) | Apache-2.0 | Apache-2.0 | Yes | a few MB | Real-time, but people only and rough edges. |
| rembg (Python) | MIT | depends on model (u2net/isnet Apache, birefnet MIT, bria non-commercial) | Depends | – | Server only, so it has a hosting cost. Good fallback if we ever add a server. |
| withoutbg | Apache SDK + DINOv3 licence | mixed | Mixed | ≈ 1.5 GB | Server only. |

### Recommendation

**Use `@huggingface/transformers@4.3.2` (Apache-2.0) with `onnx-community/BiRefNet_lite-ONNX` (MIT weights), `dtype: 'fp16'` on WebGPU and `'fp32'` on WASM.**
- The download is about 115 MB once and is then cached by the browser. Show a progress bar, and download only when the user clicks "Remove background".
- It runs fully in the visitor's browser, so there is no server cost and the image never leaves the device. That is a privacy point worth stating on the page.
- Both the code and the weights are permissive, so commercial use is allowed. Keep the MIT and Apache notices on a credits page.
- For a fast "people only" mode, offer `Xenova/modnet` at q8 (6.6 MB) as a second option.
- Do **not** use RMBG-1.4/2.0 (non-commercial) or @imgly/background-removal (AGPL) unless we buy a licence.

Load from a CDN as an ES module, or `npm i @huggingface/transformers@4.3.2` and import the same names:

```html
<script type="module">
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2';
env.allowLocalModels = false;
const webgpu = !!navigator.gpu && !!(await navigator.gpu.requestAdapter().catch(() => null));
const remover = await pipeline('background-removal', 'onnx-community/BiRefNet_lite-ONNX', {
  device: webgpu ? 'webgpu' : 'wasm',
  dtype:  webgpu ? 'fp16'   : 'fp32',
  progress_callback: (p) => console.log(p.status, p.progress ?? ''),
});
const out = await remover(imageUrlOrBlobUrl); // RawImage with an alpha channel
const blob = await out.toBlob('image/png');   // or out.toCanvas()
</script>
```

The `background-removal` pipeline task exists in Transformers.js v4; I checked this in the library source. I have not run it with BiRefNet_lite. If loading through the pipeline fails, use the model card's `AutoModel` + `AutoProcessor` path instead: run the model, apply sigmoid to the mask, resize it to the image, then apply `putAlpha`. The speed figures are typical values, not measured here. With Next.js, load it only on the client (dynamic import inside the tool component) so the server bundle stays small.

## 6. Free design resources for websites

Each item was checked on its official site or licence page. Ranked within each group. **Bold "Yes"** in the attribution column means you must credit the source.

| # | Resource | What is free | Licence | Commercial | Attribution needed |
|---|---|---|---|---|---|
| **UI kits & templates** |||||
| 1 | shadcn/ui (ui.shadcn.com) | All components and blocks | MIT | Yes | No (keep the MIT notice in source) |
| 2 | DaisyUI | Whole library | MIT | Yes | No (MIT notice) |
| 3 | HyperUI | All Tailwind components | MIT | Yes | No (MIT notice) |
| 4 | Flowbite (core) | Open-source library (Pro is paid) | MIT | Yes | No (MIT notice) |
| 5 | Preline UI | Library and Figma kit (Pro is paid) | MIT + Fair Use terms | Yes | **Yes**, credit and link if you publish a derived template or theme |
| 6 | Figma Community files | Files marked free | CC BY 4.0 by default (creator may choose another) | Yes | **Yes**, credit the creator |
| – | Tailwind Plus (ex Tailwind UI) | Almost nothing; it is a paid licence. Tailwind CSS itself is MIT | Commercial EULA | Paid only | – |
| **Icons** |||||
| 1 | Lucide | All icons | ISC | Yes | No (keep the licence notice) |
| 2 | Heroicons | All icons | MIT | Yes | No |
| 3 | Tabler Icons | All icons | MIT | Yes | No |
| 4 | Phosphor | All icons | MIT | Yes | No |
| **Fonts** |||||
| 1 | Google Fonts | All families | OFL / Apache-2.0 / UFL | Yes | No (you cannot sell the font files on their own) |
| 2 | Fontshare (Indian Type Foundry) | About 100 families | ITF Free Font License | Yes | Reported as not required. **The licence page did not load, so re-check before use.** No redistributing the files. |
| **Illustrations & photos** |||||
| 1 | unDraw | All illustrations, recolourable | unDraw licence | Yes | No (no packs or redistribution, no AI training) |
| 2 | Unsplash | Photos | Unsplash License | Yes | No (credit appreciated; do not sell unmodified copies) |
| 3 | Pexels | Photos and video | Pexels License | Yes | No (do not imply endorsement; do not resell unaltered copies) |
| 4 | Storyset (Freepik) | Animated illustrations | Freepik terms | Yes, with limits | **Yes on the free plan** |
| 5 | Freepik | Free assets | Freepik/Magnific terms | Yes, with limits | **Yes on the free plan** |
| **Colour tools** |||||
| 1 | Realtime Colors | Palette preview on a real page. Exports CSS, Tailwind, shadcn and OKLCH | Generated colours free to use | Yes | No |
| 2 | Radix Colors | Accessible 12-step scales | MIT | Yes | No |
| 3 | Tailwind palette (OKLCH in v4) | Built into Tailwind | MIT | Yes | No |
| 4 | Coolors | Generator (free tier: 5 colours, 10 saved palettes) | Terms of service | Yes | No |
| 5 | oklch.com (Evil Martians) | OKLCH picker and converter | Free web tool | Yes (output colours) | No |

**Need attribution:** Figma Community files (CC BY 4.0), Freepik and Storyset free plans, and Preline only for derived templates. Everything else needs, at most, the licence notice kept in your source code.

**Could not confirm on the official page:** Tailwind Plus pricing (login wall) and the Fontshare licence text (page did not render). Re-check both before relying on them.
