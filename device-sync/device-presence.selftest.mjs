/**
 * Device-origin create and roster presence, against a stub Odoo — no real
 * Odoo, terminal or credentials. Every scenario asserts on requests the stub
 * recorded, so a call that never happened cannot pass.
 */
import { strict as assert } from "node:assert";
import http from "node:http";
import { createBackend } from "./backend-odoo.mjs";

const calls = [];
let employees = [];
let createReply = null;

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", chunk => { body += chunk; });
  req.on("end", () => {
    const params = JSON.parse(body || "{}").params || {};
    calls.push({ path: req.url, params });
    let result;
    if (req.url === "/lugal/auth/login") {
      result = { success: true, data: { access_token: "stub", refresh_token: "stub" } };
    } else if (req.url === "/api/hr/employees/list") {
      result = { success: true, data: { items: employees, total: employees.length } };
    } else if (req.url === "/api/hr/employees/create") {
      result = createReply || { success: true, data: { id: 900, name: params.name, device_employee_no: params.device_employee_no } };
    } else if (req.url === "/api/hr/employees/device_presence") {
      result = { success: true, data: { changed: Object.fromEntries((params.absent || []).map(n => [n, { outcome: "removed_by_device" }])), unknown: [] } };
    } else {
      result = { success: true, data: {} };
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ jsonrpc: "2.0", id: 1, result }));
  });
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const apiBase = `http://127.0.0.1:${server.address().port}`;

const logs = [];
const backend = createBackend(
  { apiBase, db: "stub", username: "sync", password: "x", device: {} },
  { log: (_icon, message) => logs.push(message), todayIraq: () => "2026-09-29", getDayOfWeek: () => 2 },
);
const pathsCalled = path => calls.filter(c => c.path === path);
const reset = () => { calls.length = 0; logs.length = 0; createReply = null; };
const emp = (id, no) => ({ id, name: `E${id}`, device_employee_no: no, employee_code: `C${id}`, status: "active" });

// 1. An unknown terminal person is created as device-origin, keeping the terminal's number.
reset();
employees = [emp(1, "70"), emp(2, "71")];
await backend.reconcileEmployees([{ employeeNo: "70" }, { employeeNo: "71" }, { employeeNo: "4461", name: "Omar.T" }]);
const creates = pathsCalled("/api/hr/employees/create");
assert.equal(creates.length, 1, "one create for the one unknown person");
assert.equal(creates[0].params.source, "device");
assert.equal(creates[0].params.device_employee_no, "4461");

// 2. Presence: every roster number is present; an enrolled employee missing from it is absent.
reset();
employees = [emp(1, "70"), emp(2, "71"), emp(3, "72"), emp(4, "73"), emp(5, "74")];
await backend.reconcileEmployees(["70", "71", "72", "73"].map(employeeNo => ({ employeeNo })));
const presence = pathsCalled("/api/hr/employees/device_presence");
assert.equal(presence.length, 1);
assert.deepEqual([...presence[0].params.present].sort(), ["70", "71", "72", "73"]);
assert.deepEqual(presence[0].params.absent, ["74"]);

// 3. A roster missing more than half of the numbered employees reports no absences.
reset();
await backend.reconcileEmployees([{ employeeNo: "70" }]);
const guarded = pathsCalled("/api/hr/employees/device_presence");
assert.equal(guarded.length, 1, "presence still reported");
assert.deepEqual(guarded[0].params.absent, [], "absences withheld");
assert.ok(logs.some(l => l.includes("absences NOT reported")), "and the reason is logged");

// 4. An empty roster reports nothing at all.
reset();
await backend.reconcileEmployees([]);
assert.equal(pathsCalled("/api/hr/employees/device_presence").length, 0);
assert.ok(logs.some(l => l.includes("roster is empty")));

// 5. A number Odoo says is already held is logged, never duplicated.
reset();
employees = [emp(1, "70")];
createReply = { success: false, error_code: "device_employee_no_taken", error: "taken",
  holder: { id: 55, name: "Old Leaver", status: "exited", active: false } };
const created = await backend.createEmployee({ employeeNo: "4462", name: "Returner" });
assert.equal(created, null);
assert.equal(pathsCalled("/api/hr/employees/create").length, 1, "tried once");
assert.ok(logs.some(l => l.includes("belongs to Odoo employee 55")));

server.close();
console.log("device-presence selftest: 5 scenarios passed");
