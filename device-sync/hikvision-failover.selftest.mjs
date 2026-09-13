/**
 * HikvisionClient failover against local stub servers — no real terminal and no
 * device credentials are involved. Every scenario asserts on hits recorded by a
 * stub it started, so a request that never went anywhere cannot pass.
 */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { HikvisionClient } from "./hikvision-api.mjs";

const REFUSED = "127.0.0.1"; // nothing listens on the stub port (until scenario 5)
const OK = "127.0.0.2";
const HANG = "127.0.0.3"; // accepts, never answers, keeps accepting
const NOTHING = "127.0.0.4";
const TLS_OK = "127.0.0.5";
const DYING = "127.0.0.7"; // takes the request, then the interface goes away
const TLS_DYING = "127.0.0.8";
const BLACKHOLE = "192.0.2.1"; // TEST-NET-1: nothing answers, so the connect times out

const DEVICE_INFO = "GET /ISAPI/System/deviceInfo?format=json";
const ENROL = "POST /ISAPI/AccessControl/UserInfo/Record?format=json";

// Throwaway self-signed certificate for the HTTPS stubs — generated per run, never committed.
const certDir = mkdtempSync(join(tmpdir(), "hik-failover-"));
execFileSync("openssl", [
  "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1", "-subj", "/CN=stub",
  "-keyout", join(certDir, "key.pem"), "-out", join(certDir, "cert.pem"),
], { stdio: "ignore" });
const tlsOpts = {
  key: readFileSync(join(certDir, "key.pem")),
  cert: readFileSync(join(certDir, "cert.pem")),
};
rmSync(certDir, { recursive: true, force: true });
const httpCreate = (handler) => http.createServer(handler);
const httpsCreate = (handler) => https.createServer(tlsOpts, handler);

function listen(server, host, port) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve(server.address().port));
  });
}

function okStub(create, model, hits) {
  return create((req, res) => {
    req.resume();
    req.on("end", () => {
      hits.push(`${req.method} ${req.url}`);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ DeviceInfo: { model, serialNumber: `SN-${model}` } }));
    });
  });
}

function hangStub(create, hits) {
  return create((req) => {
    hits.push(`${req.method} ${req.url}`);
  });
}

// The request reaches the device, then the interface drops: the open connection
// hangs and every new connection is refused. This is the case where replaying a
// write on the other interface would enrol or delete a person twice.
function dyingStub(create, hits) {
  const server = create((req) => {
    hits.push(`${req.method} ${req.url}`);
    server.close();
  });
  return server;
}

const okHits = [];
const hangHits = [];
const lanHits = [];
const dyingHits = [];
const tlsOkHits = [];
const reset = () => [okHits, hangHits, lanHits, dyingHits, tlsOkHits].forEach((a) => (a.length = 0));

const okServer = okStub(httpCreate, "WIFI", okHits);
const PORT = await listen(okServer, OK, 0);
const hangServer = hangStub(httpCreate, hangHits);
await listen(hangServer, HANG, PORT);
const tlsOkServer = okStub(httpsCreate, "TLS-WIFI", tlsOkHits);
const TPORT = await listen(tlsOkServer, TLS_OK, 0);

const logs = [];
function client(lan, wifi, extra = {}) {
  return new HikvisionClient({
    addresses: [{ network: "lan", ip: lan }, { network: "wifi", ip: wifi }],
    port: PORT,
    username: "admin",
    password: "",
    useHttps: false,
    connectTimeoutMs: 500,
    requestTimeoutMs: 800,
    log: (_emoji, msg) => logs.push(msg),
    ...extra,
  });
}

// 0. Legacy single-ip construction (the one-off scripts) still works.
{
  reset();
  const hik = new HikvisionClient({ ip: OK, port: PORT, useHttps: false });
  assert.equal((await hik.getDeviceInfo()).model, "WIFI");
  assert.deepEqual(hik.selector.allIps, [OK]);
  assert.deepEqual(okHits, [DEVICE_INFO]);
}

// 1. LAN answers → LAN is used and Wi-Fi is never touched.
{
  reset();
  const hik = client(OK, NOTHING);
  assert.equal((await hik.getDeviceInfo()).model, "WIFI");
  assert.equal(hik.selector.active.network, "lan");
  assert.deepEqual(okHits, [DEVICE_INFO]);
  assert.deepEqual(logs, []);
}

// 2. LAN refuses → the same GET succeeds on Wi-Fi, once.
reset();
const onWifi = client(REFUSED, OK);
assert.equal((await onWifi.getDeviceInfo()).model, "WIFI");
assert.equal(onWifi.selector.active.network, "wifi");
assert.equal(onWifi.baseUrl, `http://${OK}:${PORT}`);
assert.deepEqual(okHits, [DEVICE_INFO]);
assert.equal(logs.at(-1), `Device address switched lan (${REFUSED}) → wifi (${OK})`);

// 3. LAN blackholed → fails over within the CONNECT timeout. The request timeout is
//    set to 10 s so that only the connect timer can make this fast.
{
  reset();
  const hik = client(BLACKHOLE, OK, { requestTimeoutMs: 10000 });
  const t0 = Date.now();
  assert.equal((await hik.getDeviceInfo()).model, "WIFI");
  const elapsed = Date.now() - t0;
  assert.equal(hik.selector.active.network, "wifi");
  assert.deepEqual(okHits, [DEVICE_INFO]);
  assert.ok(elapsed < 2500, `failover took ${elapsed}ms`);
  console.log(`   blackholed LAN → Wi-Fi in ${elapsed}ms`);
}

// 4. An enrolment POST refused on LAN never reached the device → sent on Wi-Fi exactly once.
{
  reset();
  const hik = client(REFUSED, OK);
  await hik._postJson("/ISAPI/AccessControl/UserInfo/Record", { UserInfo: { employeeNo: "1" } });
  assert.deepEqual(okHits, [ENROL]);
  assert.equal(hik.selector.active.network, "wifi");
}

// 5. LAN recovers → the health check's select() moves back to LAN, and requests follow.
{
  reset();
  const lanServer = okStub(httpCreate, "LAN", lanHits);
  await listen(lanServer, REFUSED, PORT);
  await onWifi.selector.select();
  assert.equal(onWifi.selector.active.network, "lan");
  assert.equal((await onWifi.getDeviceInfo()).model, "LAN");
  assert.deepEqual(lanHits, [DEVICE_INFO]);
  assert.deepEqual(okHits, []);
  assert.equal(logs.at(-1), `Device address switched wifi (${OK}) → lan (${REFUSED})`);
  lanServer.closeAllConnections();
  await new Promise((r) => lanServer.close(r));
}

// 6. POST reaches the device, then LAN drops → NOT replayed on Wi-Fi, even though Wi-Fi is up.
{
  reset();
  const dying = dyingStub(httpCreate, dyingHits);
  await listen(dying, DYING, PORT);
  const hik = client(DYING, OK);
  await assert.rejects(
    hik._postJson("/ISAPI/AccessControl/UserInfo/Record", { UserInfo: { employeeNo: "2" } }),
    (err) => err.code === "ETIMEDOUT" && err.deviceConnected === true,
  );
  assert.deepEqual(dyingHits, [ENROL]);
  assert.deepEqual(okHits, []);
  assert.equal(hik.selector.active.network, "lan"); // never re-selected
  dying.closeAllConnections();
}

// 6b. Identical conditions for a GET → replayed on Wi-Fi and succeeds. Together with 6 this
//     proves the method guard is what stops the POST, not an unreachable Wi-Fi.
{
  reset();
  const dying = dyingStub(httpCreate, dyingHits);
  await listen(dying, DYING, PORT);
  const hik = client(DYING, OK);
  assert.equal((await hik.getDeviceInfo()).model, "WIFI");
  assert.deepEqual(dyingHits, [DEVICE_INFO]);
  assert.deepEqual(okHits, [DEVICE_INFO]);
  assert.equal(hik.selector.active.network, "wifi");
  dying.closeAllConnections();
}

// 7. A GET that hangs while LAN still accepts connections surfaces the error — both
//    interfaces are the same device, so switching would not help; the next poll retries.
{
  reset();
  const hik = client(HANG, OK);
  await assert.rejects(hik.getDeviceInfo(), (err) => err.code === "ETIMEDOUT");
  assert.deepEqual(hangHits, [DEVICE_INFO]);
  assert.deepEqual(okHits, []);
  assert.equal(hik.selector.active.network, "lan");
}

// 8. Both addresses dead → one error naming both.
{
  reset();
  const hik = client(BLACKHOLE, NOTHING);
  await assert.rejects(
    hik.getDeviceInfo(),
    /Device unreachable on every configured address \(lan=192\.0\.2\.1, wifi=127\.0\.0\.4\)/,
  );
}

// 9. HTTPS (production uses it): LAN refused → Wi-Fi over TLS.
{
  reset();
  const hik = client(REFUSED, TLS_OK, { port: TPORT, useHttps: true });
  assert.equal((await hik.getDeviceInfo()).model, "TLS-WIFI");
  assert.equal(hik.selector.active.network, "wifi");
  assert.deepEqual(tlsOkHits, [DEVICE_INFO]);
}

// 10. HTTPS: POST reaches the device, then LAN drops → the connected flag is set on a TLS
//     socket too, so the POST is not replayed.
{
  reset();
  const dying = dyingStub(httpsCreate, dyingHits);
  await listen(dying, TLS_DYING, TPORT);
  const hik = client(TLS_DYING, TLS_OK, { port: TPORT, useHttps: true });
  await assert.rejects(
    hik._postJson("/ISAPI/AccessControl/UserInfo/Record", { UserInfo: { employeeNo: "3" } }),
    (err) => err.code === "ETIMEDOUT" && err.deviceConnected === true,
  );
  assert.deepEqual(dyingHits, [ENROL]);
  assert.deepEqual(tlsOkHits, []);
  assert.equal(hik.selector.active.network, "lan");
  dying.closeAllConnections();
}

for (const server of [okServer, hangServer, tlsOkServer]) {
  server.closeAllConnections();
  server.close();
}
http.globalAgent.destroy();
https.globalAgent.destroy();
console.log("hikvision-api.mjs failover OK");
