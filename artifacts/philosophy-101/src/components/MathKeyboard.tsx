import { useState } from "react";
import { Sigma, ChevronDown, ChevronUp } from "lucide-react";

type Group = { label: string; symbols: string[] };

const GROUPS: Group[] = [
  {
    label: "Greek",
    symbols: [
      "α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ϑ", "ι", "κ", "λ", "μ", "ν",
      "ξ", "ο", "π", "ϖ", "ρ", "σ", "ς", "τ", "υ", "φ", "ϕ", "χ", "ψ", "ω",
      "Γ", "Δ", "Θ", "Λ", "Ξ", "Π", "Σ", "Υ", "Φ", "Ψ", "Ω", "∇",
    ],
  },
  {
    label: "Operators",
    symbols: [
      "+", "−", "×", "÷", "±", "∓", "·", "∗", "⋅", "∘", "⊕", "⊖", "⊗", "⊘",
      "⊙", "√", "∛", "∜", "∑", "∏", "∐", "∫", "∬", "∭", "∮", "∂", "∆", "‰",
      "⌈", "⌉", "⌊", "⌋", "⟨", "⟩",
    ],
  },
  {
    label: "Relations",
    symbols: [
      "=", "≠", "≈", "≅", "≡", "≢", "≜", "≝", "∝", "<", ">", "≤", "≥", "≦",
      "≧", "≪", "≫", "≲", "≳", "≺", "≻", "⊀", "⊁", "⊑", "⊒", "≼", "≽", "∣",
      "∤", "∥", "∦",
    ],
  },
  {
    label: "Sets",
    symbols: [
      "∈", "∉", "∋", "∌", "⊂", "⊃", "⊄", "⊅", "⊆", "⊇", "⊊", "⊋", "∪", "∩",
      "⊎", "∖", "∅", "∁", "℘", "ℵ", "ℶ", "ℕ", "ℤ", "ℚ", "ℝ", "ℂ", "ℙ", "𝔽",
    ],
  },
  {
    label: "Logic",
    symbols: [
      "¬", "∧", "∨", "⊻", "⊼", "⊽", "→", "←", "↔", "⇒", "⇐", "⇔", "⊕", "∀",
      "∃", "∄", "∴", "∵", "⊢", "⊣", "⊨", "⊭", "□", "◇", "≔", "≡", "⟹", "⟺",
    ],
  },
  {
    label: "Calculus",
    symbols: [
      "∂", "∫", "∬", "∭", "∮", "∯", "∰", "∇", "∞", "′", "″", "‴", "Δ", "δ",
      "𝑑", "∆", "Σ", "∏", "lim", "→", "↦", "ℏ", "∝", "≈", "∼", "≃",
    ],
  },
  {
    label: "Arrows",
    symbols: [
      "→", "←", "↑", "↓", "↔", "↕", "↗", "↘", "↙", "↖", "⇒", "⇐", "⇑", "⇓",
      "⇔", "↦", "↤", "⟶", "⟵", "⟷", "⟹", "⟸", "⟺", "↻", "↺", "⇌", "⇄",
    ],
  },
  {
    label: "Misc",
    symbols: [
      "°", "∠", "∡", "∢", "⊥", "∥", "△", "▷", "□", "◯", "•", "∎", "ℓ", "℧",
      "∅", "%", "‱", "†", "‡", "§", "¶", "©", "®", "™", "€", "£", "¥", "¢",
    ],
  },
  {
    label: "x² xₙ",
    symbols: [
      "⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹", "⁺", "⁻", "⁼", "⁽",
      "⁾", "ⁿ", "ⁱ", "ˣ", "₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉",
      "₊", "₋", "₌", "₍", "₎", "ₐ", "ₑ", "ₓ", "ₙ", "ₖ", "ₘ", "ₚ", "ₛ", "ₜ",
    ],
  },
];

export function MathKeyboard({
  open,
  onToggle,
  onInsert,
}: {
  open: boolean;
  onToggle: () => void;
  onInsert: (symbol: string) => void;
}) {
  const [active, setActive] = useState(0);
  const group = GROUPS[active] ?? GROUPS[0];

  return (
    <div className="rounded-md border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-toggle-math-keyboard"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-1.5">
          <Sigma className="w-3.5 h-3.5" />
          Math symbols
        </span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5" />
        )}
      </button>

      {open && (
        <div className="border-t border-border p-2">
          <div className="flex flex-wrap gap-1 mb-2">
            {GROUPS.map((g, i) => (
              <button
                key={g.label}
                type="button"
                onClick={() => setActive(i)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  i === active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
                data-testid={`tab-math-group-${g.label}`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(2rem,1fr))] gap-1 max-h-40 overflow-y-auto">
            {group.symbols.map((sym, i) => (
              <button
                key={`${sym}-${i}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onInsert(sym);
                }}
                className="h-8 rounded border border-border bg-background text-sm hover:bg-secondary hover:border-primary/50 transition-colors flex items-center justify-center"
                data-testid={`button-math-symbol-${i}`}
                title={sym}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
