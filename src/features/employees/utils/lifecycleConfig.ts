export const parseKeyLabelMap = (
  configStr: string,
  defaults: Record<string, string>,
): Record<string, string> => {
  if (!configStr) return defaults;

  const map: Record<string, string> = {};
  configStr.split(",").forEach(pair => {
    const [key, label] = pair.split(":").map(value => value.trim());
    if (key && label) map[key] = label;
  });

  return Object.keys(map).length > 0 ? map : defaults;
};
