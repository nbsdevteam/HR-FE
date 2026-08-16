
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { LocalizationProvider } from "./i18n/LocalizationProvider.tsx";
  import "./i18n";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <LocalizationProvider>
      <App />
    </LocalizationProvider>,
  );
