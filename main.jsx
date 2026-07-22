import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Polyfill window.storage (only exists inside Claude's artifact preview) using
// the browser's own localStorage, so the app works the same on a real deployed site.
if (!window.storage) {
  const prefixFor = (shared) => (shared ? "rm_shared:" : "rm_personal:");
  window.storage = {
    async get(key, shared = false) {
      const raw = localStorage.getItem(prefixFor(shared) + key);
      if (raw === null) throw new Error("Key not found");
      return { key, value: raw, shared };
    },
    async set(key, value, shared = false) {
      localStorage.setItem(prefixFor(shared) + key, value);
      return { key, value, shared };
    },
    async delete(key, shared = false) {
      localStorage.removeItem(prefixFor(shared) + key);
      return { key, deleted: true, shared };
    },
    async list(prefix = "", shared = false) {
      const p = prefixFor(shared) + prefix;
      const keys = Object.keys(localStorage)
        .filter((k) => k.startsWith(p))
        .map((k) => k.slice(prefixFor(shared).length));
      return { keys, prefix, shared };
    },
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
