import SettingsWorkspace from "../components/SettingsWorkspace";
import SettingsBootstrapProvider from "../context/SettingsBootstrapContext";

const SettingsPage = () => (
  <SettingsBootstrapProvider>
    <SettingsWorkspace />
  </SettingsBootstrapProvider>
);

export default SettingsPage;
