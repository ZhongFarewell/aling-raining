export function random(from?: number, to?: number, interpolation?: (n: number) => number): number {
  let start: number
  let end: number
  let interp: (n: number) => number

  if (from === undefined) {
    start = 0
    end = 1
  } else if (from !== undefined && to === undefined) {
    end = from
    start = 0
  } else {
    start = from!
    end = to!
  }

  const delta = end - start

  if (interpolation === undefined) {
    interp = (n: number) => n
  } else {
    interp = interpolation
  }

  return start + interp(Math.random()) * delta
}

export function chance(c: number): boolean {
  return random() <= c
}
