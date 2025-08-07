export function writeChar(el, char, style) {
  el.innerHTML += char;
  style.textContent += char;
}
export function writeSimpleChar(el, char) {
  el.innerHTML += char;
}
export function handleChar(styleHTML, char) {
  return styleHTML + char;
}
