# Code Rules

1. No `.tsx` file should exceed 300 lines of code. If it does, break it down into smaller components and call them inside that file.

2. In each file you write or rewrite, order hooks as: `useState` → custom hooks → `useRef` → `useMemo` → `useCallback` → `useEffect`.

3. Whenever a prompt finishes running, commit with a proper message in the form `muntadher-{what work we did}`.

4. If you write or rewrite a function that is exported from a file, always export it as `const`.

5. When passing a function from a parent component to a child component, always use `useCallback` to memoize the function when possible.

6. When writing or rewriting a file and you come across a `.map()` that renders some TSX inline, always extract that TSX into a dedicated component inside the `components` folder in the same directory as the main component, then call it inside the `.map()`.

7. Declare every component as `const ComponentName = (...) => { ... };` (arrow function, no inline `export`), and add `export default ComponentName;` as the last line of the file. Non-component named exports (types, constants, helpers) keep their normal `export`/`export const`.
