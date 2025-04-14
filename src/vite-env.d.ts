// src/vite-env.d.ts

// import css modules
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}
