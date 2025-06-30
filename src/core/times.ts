export default function times(n: number, f: (index: number) => void): void {
  for (let i = 0; i < n; i++) {
    f(i)
  }
}
