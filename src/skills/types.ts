// One skill = one file in src/skills/ + one line in registry.ts.
// kind 'assistant' gets the generic form → answer panel.
// kind 'voice' gets the voice studio panel.

export type Field = {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  hint?: string;
  options?: string[];
  /** Shown instead of options in other languages; the value sent stays the option */
  optionLabels?: string[];
  required?: boolean;
  /** Hidden under "İstəyə bağlı" until opened */
  optional?: boolean;
  rows?: number;
};

export type Skill = {
  slug: string;
  name: string;
  /** One line under the name. Plain, concrete. */
  tagline: string;
  /** Home "what do you want to do?" card: a plain question or action */
  ask: string;
  /** Values for the "Nümunə ilə yoxla" button */
  example?: Record<string, string>;
  /** Two or three sentences for the home page section. */
  about: string;
  /** What you get, 3–4 short points. */
  gives: string[];
  group: 'Xaricdə təhsil' | 'İş' | 'Səs' | 'Marketinq';
  kind: 'assistant' | 'voice';
  /** free = open to everyone; pro = needs the paid plan once accounts are live */
  access: 'free' | 'pro';
  /** Accent colour for the skill's mark (CSS colour) */
  tone: string;
  /** Short monogram shown in the sidebar and cards */
  mark: string;
  fields?: Field[];
  /** Turns the form values into the user's message */
  buildRequest?: (v: Record<string, string>) => string;
  submitLabel?: string;
  /** Public GitHub source: the "Add to your own Claude" panel offers copy and install */
  install?: { repo: string; ref: string; dir?: string; folder: string };
  /** Paid skill: the panel links here instead of offering a copy */
  agensiUrl?: string;
  sourceUrl?: string;
  /** Shown under the answer */
  footnote?: string;
};
