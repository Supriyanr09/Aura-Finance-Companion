// DEPRECATED — replaced by FinanceStream.jsx
// CurrencyRow used CSS keyframe scroll + periodic setInterval digit mutation.
// The mutation behavior was the core problem — it made numbers feel like counters.
// FinanceStream uses rAF-driven position only. Content never changes.
export default function CurrencyRow() { return null }
