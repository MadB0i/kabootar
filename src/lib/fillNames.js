/** Replace {to} / {from} placeholders in a message line with real names. */
export function fillNames(text, data) {
  if (typeof text !== 'string') return ''
  const to = data?.to || ''
  const from = data?.from || ''
  return text.replaceAll('{to}', to).replaceAll('{from}', from)
}

/** True when a filled line already contains the receiver's name
 *  (used to avoid showing the name twice on card 0). */
export function lineHasTo(text, data) {
  const to = data?.to || ''
  if (!to) return false
  return fillNames(text, data).includes(to)
}
