export function random(from?: number, to?: number, interpolation?: (n: number) => number) {
  if (from === undefined) {
    from = 0
    to = 1
  } else if (from !== undefined && to === undefined) {
    to = from
    from = 0
  }
  const delta = (to as number) - (from as number)

  if (!interpolation) {
    interpolation = (n: number) => n
  }
  return (from as number) + interpolation(Math.random()) * delta
}
export function chance(c: any) {
  return random() <= c
}
