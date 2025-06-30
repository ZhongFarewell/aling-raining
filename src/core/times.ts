export default function times(this: any, n: number, f: (i: number) => void) {
  for (let i = 0; i < n; i++) {
    f.call(this, i)
  }
}
