import { strict as assert } from "node:assert";
import { resolveDeviceAddresses, DeviceAddressSelector } from "./device-address.mjs";

const LAN = "192.168.15.15";
const WIFI = "192.168.116.115";

// ── resolveDeviceAddresses ──
assert.deepEqual(
  resolveDeviceAddresses({ DEVICE_LAN_IP: LAN, DEVICE_WIFI_IP: WIFI }),
  [{ network: "lan", ip: LAN }, { network: "wifi", ip: WIFI }],
);
// An existing .env holding only DEVICE_IP keeps working, as the LAN address.
assert.deepEqual(resolveDeviceAddresses({ DEVICE_IP: LAN }), [{ network: "lan", ip: LAN }]);
// DEVICE_LAN_IP wins over the legacy alias.
assert.deepEqual(resolveDeviceAddresses({ DEVICE_IP: "10.0.0.1", DEVICE_LAN_IP: LAN })[0], { network: "lan", ip: LAN });
// The same address twice is one candidate, not two probes of one host.
assert.deepEqual(resolveDeviceAddresses({ DEVICE_LAN_IP: LAN, DEVICE_WIFI_IP: LAN }), [{ network: "lan", ip: LAN }]);
// Nothing configured fails loudly instead of falling back to a hardcoded address.
assert.throws(() => resolveDeviceAddresses({}), /DEVICE_LAN_IP/);

// ── DeviceAddressSelector ──
const up = new Set([LAN, WIFI]);
const probed = [];
const logs = [];
const sel = new DeviceAddressSelector(resolveDeviceAddresses({ DEVICE_LAN_IP: LAN, DEVICE_WIFI_IP: WIFI }), {
  port: 443,
  probe: async (ip) => {
    probed.push(ip);
    return up.has(ip);
  },
  log: (_emoji, msg) => logs.push(msg),
});

// 1. Both up → LAN, and Wi-Fi is never probed.
assert.equal((await sel.select()).network, "lan");
assert.deepEqual(probed, [LAN]);
assert.deepEqual(logs, []);

// 2. LAN down → Wi-Fi, reached only after LAN was tried first.
up.delete(LAN);
probed.length = 0;
assert.equal((await sel.select()).network, "wifi");
assert.deepEqual(probed, [LAN, WIFI]);
assert.equal(sel.active.ip, WIFI);
assert.equal(logs.at(-1), `Device address switched lan (${LAN}) → wifi (${WIFI})`);
// The identity does not follow the active network.
assert.equal(sel.identityIp, LAN);
assert.deepEqual(sel.allIps, [LAN, WIFI]);

// 3. Still down → stays on Wi-Fi without logging the switch again.
assert.equal((await sel.select()).network, "wifi");
assert.equal(logs.length, 1);

// 4. LAN recovers → back on LAN at the next select (the health check).
up.add(LAN);
assert.equal((await sel.select()).network, "lan");
assert.equal(logs.at(-1), `Device address switched wifi (${WIFI}) → lan (${LAN})`);
assert.equal(logs.length, 2);

// 5. Both down → rejects naming both addresses, after trying both, and keeps the last active one.
up.clear();
probed.length = 0;
await assert.rejects(sel.select(), new RegExp(`lan=${LAN}, wifi=${WIFI}`.replaceAll(".", "\\.")));
assert.deepEqual(probed, [LAN, WIFI]);
assert.equal(sel.active.network, "lan");

// 6. Four concurrent failures share one probe round and log one switch.
up.add(WIFI);
probed.length = 0;
const results = await Promise.all([sel.select(), sel.select(), sel.select(), sel.select()]);
assert.deepEqual(results.map((a) => a.network), ["wifi", "wifi", "wifi", "wifi"]);
assert.deepEqual(probed, [LAN, WIFI]);
assert.equal(logs.length, 3);
assert.equal(logs.at(-1), `Device address switched lan (${LAN}) → wifi (${WIFI})`);

console.log("device-address.mjs OK");
