// GT10 fixture (S16) — accessibility done with REAL semantic HTML, NEVER an overlay widget.
// Real <button>, real <label htmlFor>, proper heading order. NO a11y-overlay vendor script is
// injected anywhere (overlays are a silent LEGAL failure — the FTC fined the leading vendor $1M;
// 22.6% of H1-2025 a11y suits targeted sites WITH an overlay). GT10 (L1) asserts: real
// <button>/<label htmlFor> used. GT10 (L3) asserts: no overlay dep/script present. (The comment
// avoids naming the vendors so the negative control measures real deps, not this prose.)
export function LoginForm() {
  return (
    <form>
      <h2>Sign in</h2>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" name="email" autoComplete="email" />
      <label htmlFor="password">Password</label>
      <input id="password" type="password" name="password" autoComplete="current-password" />
      <button type="submit">Sign in</button>
    </form>
  );
}
