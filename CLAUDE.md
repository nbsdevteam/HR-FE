# Code Rules

1. No `.tsx` file should exceed 300 lines of code. If it does, break it down into smaller components and call them inside that file. Run `npm run size-check` to list any file over the limit.

2. In each file you write or rewrite, order hooks as: `useState` → custom hooks → `useRef` → `useMemo` → `useCallback` → `useEffect`.

3. Whenever a prompt finishes running, commit with a proper message in the form `muntadher-{what work we did}`.

4. If you write or rewrite a function that is exported from a file, always export it as `const`.

5. When passing a function from a parent component to a child component, always use `useCallback` to memoize the function when possible.

6. When writing or rewriting a file and you come across a `.map()` that renders some TSX inline, always extract that TSX into a dedicated component inside the `components` folder in the same directory as the main component, then call it inside the `.map()`.

7. Declare every component as `const ComponentName = (...) => { ... };` (arrow function, no inline `export`), and add `export default ComponentName;` as the last line of the file. Non-component named exports (types, constants, helpers) keep their normal `export`/`export const`.

8. Whenever you write or touch a file, remove any unused imports in it.

9. Before adding a new local Button, Modal, Table, KanbanColumn, or stat-tile component, check `src/shared/components/` first — a generic version likely already exists there (`Button`, `Modal`, `DataTable`, `KanbanColumn`, `StatCard`, `ConfirmDeleteModal`, `ModalHeader`, `ModalFooterActions`). Only build a local one-off if the shared component genuinely can't represent the needed shape.

10. Never pass an inline anonymous function to an event prop (`onClick`, `onChange`, `onSubmit`, etc.). Declare a named handler (e.g. `handleDesignationChange`) in the component body above the `return`, type its event parameter explicitly with the correct React/DOM event type (never `any`), and pass the function by reference.

    ```tsx
    // ❌ inline, untyped
    <select onChange={(e) => onFormChange({ designationId: e.target.value })} />

    // ✅ extracted, strictly typed
    const handleDesignationChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
      onFormChange({ designationId: e.target.value });
    };
    <select onChange={handleDesignationChange} />
    ```
