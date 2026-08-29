# Synapse UI

`@/app/UI` owns repeated visual behaviour without owning feature layout.

- `UI.module.css` is the single stylesheet for public UI primitives.
- `Surface` owns repeated translucent backgrounds. Opacity, tone, border, blur,
  dimensions, radius, and padding are selected where the component is used.
- `Input`, `Select`, and `Textarea` expose the same controls for form surfaces.
- `Button` contains only button treatments already used by Synapse.
- `PropertyRow` and `MessageBubble` exist because their complete patterns repeat.
- Tailwind remains appropriate for one-off layout, responsive composition, and
  feature state. Do not promote a single local class into the UI library.
- Refactoring into this folder must preserve the rendered colour, dimensions,
  interaction, and responsive behaviour unless a design change is requested.

```tsx
<Surface opacity={0.35} width="80%" height="85vh" blur="md">
  {children}
</Surface>
```
