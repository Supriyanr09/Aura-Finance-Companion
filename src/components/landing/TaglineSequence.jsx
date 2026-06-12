// TaglineSequence.jsx — scroll-driven word expansion sequence
// Styles: src/styles/landing.css (.lp-sequence__)
// Note: transform + opacity are scroll-computed, applied via style prop —
// these are animation values (not design values) so style prop is correct here.

function remap(v, inLow, inHigh, outLow, outHigh) {
  const t = Math.max(0, Math.min(1, (v - inLow) / (inHigh - inLow)))
  return outLow + t * (outHigh - outLow)
}

function WordStage({ word, progress, inStart, inEnd, outStart, outEnd, maxScale = 5.5 }) {
  const fadeIn  = remap(progress, inStart, inEnd,   0, 1)
  const fadeOut = remap(progress, outStart, outEnd,  1, 0)
  const opacity = Math.min(fadeIn, fadeOut)
  const scale   = 1 + remap(progress, inStart, Math.min(outEnd, 1), 0, maxScale - 1)

  if (opacity <= 0.005) return null

  return (
    <div
      className="lp-sequence__stage"
      style={{ opacity, transform: `scale(${scale})`, willChange: 'transform, opacity' }}
    >
      <span className="lp-sequence__word">{word}</span>
    </div>
  )
}

export default function TaglineSequence({ scrollProgress = 0, visible = false }) {
  if (!visible) return null

  return (
    <div className="lp-sequence">
      <WordStage word="Explore."  progress={scrollProgress} inStart={0.00} inEnd={0.18} outStart={0.28} outEnd={0.42} maxScale={4.8} />
      <WordStage word="Navigate." progress={scrollProgress} inStart={0.38} inEnd={0.55} outStart={0.65} outEnd={0.78} maxScale={5.2} />
      <WordStage word="Prosper."  progress={scrollProgress} inStart={0.74} inEnd={0.92} outStart={1.10} outEnd={1.30} maxScale={6.0} />
    </div>
  )
}
