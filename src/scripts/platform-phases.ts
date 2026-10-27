// The platform diagram's three phases, one per chapter of the flagship case. Shared by
// PlatformDiagram.astro (the markup) and home.js (which rebuilds the pinned diagram as the
// chapters scroll past). Keys name the diagram's boxes.
export const PRODUCTS: string[] = ["gw", "wal", "tre", "con"];
export const NETS: string[] = ["tron", "eth", "bsc", "sol", "btc"];

// Per phase: the boxes shown, the product count in the title bar, and what screen readers hear.
// The gateway launched on TRON and Ethereum; the other three networks came in phase 2, after it
// opened to outside businesses.
export const PHASES: { on: string[]; count: string; say: string }[] = [
  { on: ["gw", "con", "tron", "eth"], count: "two",
    say: "a payment gateway and the admin console that runs it, on one shared core, connected to TRON and Ethereum." },
  { on: ["gw", "wal", "con", ...NETS], count: "three",
    say: "a consumer wallet joins as a client of the gateway, and BNB Smart Chain, Solana and Bitcoin join TRON and Ethereum, five networks in all." },
  { on: ["gw", "wal", "tre", "con", ...NETS], count: "four",
    say: "four products, a payment gateway, a consumer wallet, a treasury product and an admin console, on one shared core, connected to five blockchain networks." }
];
