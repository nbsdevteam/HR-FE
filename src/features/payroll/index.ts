export * from "./services/payslip-engine";

// `./services/payslip-parsing` is deliberately NOT re-exported here. It is the
// only module that imports `xlsx` (~870KB), and re-exporting it through this
// barrel dragged that parser into every component importing a value such as
// `formatCurrency` or `DEFAULT_SETTINGS` — defeating the split it was created
// for. Its single consumer (UploadTab) imports it directly by path.
