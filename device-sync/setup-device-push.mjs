#!/usr/bin/env node
/**
 * Setup Hikvision Device Push Notifications
 * ──────────────────────────────────────────
 * Configures the Hikvision DS-K1T342MFWX to push real-time
 * attendance events to the sync service via ISAPI subscription.
 *
 * Usage:
 *   node setup-device-push.mjs                    # auto-detect local IP
 *   node setup-device-push.mjs 192.168.15.100     # specify server IP
 *
 * What this does:
 *   1. Checks existing subscriptions on the device
 *   2. Creates/updates an HTTP host subscription for AccessControl events
 *   3. The device will POST events to http://<your-ip>:8089/ISAPI/Event/notification/alertStream
 *
 * After running this, every fingerprint/face scan is instantly pushed
 * to the sync service — no polling needed for real-time data.
 */

import "dotenv/config";
import { HikvisionClient } from "./hikvision-api.mjs";
import os from "node:os";

// ── Config ──
const config = {
  ip: process.env.DEVICE_IP || "192.168.15.15",
  port: parseInt(process.env.DEVICE_PORT || "443"),
  username: process.env.DEVICE_USERNAME || "admin",
  password: process.env.DEVICE_PASSWORD || "",
  useHttps: process.env.DEVICE_USE_HTTPS !== "false",
};

const PUSH_PORT = parseInt(process.env.PUSH_LISTENER_PORT || "8089");
const SERVER_IP = process.argv[2] || detectLocalIP();

function detectLocalIP() {
  const interfaces = os.networkInterfaces();
  // Prefer an address on the same 192.168.x.x subnet as the device
  for (const addrs of Object.values(interfaces)) {
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal && addr.address.startsWith("192.168.")) {
        return addr.address;
      }
    }
  }
  // Fallback: first non-internal IPv4
  for (const addrs of Object.values(interfaces)) {
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) return addr.address;
    }
  }
  return "127.0.0.1";
}

const hik = new HikvisionClient(config);
const CALLBACK_URL = `http://${SERVER_IP}:${PUSH_PORT}/ISAPI/Event/notification/alertStream`;

function log(emoji, msg) {
  console.log(`  ${emoji} ${msg}`);
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Hikvision Push Event Configuration");
  console.log("═══════════════════════════════════════════\n");

  // 1. Test connection
  log("🔗", `Connecting to device at ${config.ip}:${config.port}...`);
  try {
    const info = await hik.getDeviceInfo();
    log("✅", `Connected: ${info.model} (FW: ${info.firmwareVersion})`);
  } catch (err) {
    log("❌", `Cannot connect: ${err.message}`);
    process.exit(1);
  }

  log("📡", `Server IP: ${SERVER_IP}`);
  log("📡", `Callback URL: ${CALLBACK_URL}`);
  console.log("");

  // 2. Check existing subscriptions
  log("🔍", "Checking existing event subscriptions...");
  let existingSubs = [];
  try {
    const result = await hik._get("/ISAPI/Event/notification/httpHosts");
    const data = result.json;
    if (data?.HttpHostNotificationList?.HttpHostNotification) {
      const subs = data.HttpHostNotificationList.HttpHostNotification;
      existingSubs = Array.isArray(subs) ? subs : [subs];
    }
    log("📋", `Found ${existingSubs.length} existing subscription(s)`);
    for (const sub of existingSubs) {
      log("  ", `  #${sub.id}: ${sub.ipAddress || "?"}:${sub.portNo || "?"} → ${sub.url || "?"}`);
    }
  } catch (err) {
    log("⚠️", `Could not read subscriptions: ${err.message}`);
    log("💡", "Will try to create one anyway...");
  }

  // 3. Create/update subscription using PUT (ID=1)
  console.log("");
  log("📝", "Configuring push subscription...");

  const subscriptionPayload = {
    HttpHostNotification: {
      id: "1",
      url: "/ISAPI/Event/notification/alertStream",
      protocolType: "HTTP",
      parameterFormatType: "JSON",
      addressingFormatType: "ipaddress",
      ipAddress: SERVER_IP,
      portNo: PUSH_PORT,
      httpAuthenticationMethod: "none",
      eventType: "AccessControllerEvent",
      eventState: "active",
      eventMode: "all",
    },
  };

  let pushConfigured = false;

  // Try PUT first (update existing slot #1)
  try {
    await hik._putJson("/ISAPI/Event/notification/httpHosts/1", subscriptionPayload);
    log("✅", "Push subscription configured (PUT #1)!");
    pushConfigured = true;
  } catch (err) {
    log("⚠️", `PUT failed: ${err.message}`);
  }

  // Try POST if PUT failed
  if (!pushConfigured) {
    try {
      log("💡", "Trying POST method...");
      await hik._postJson("/ISAPI/Event/notification/httpHosts", subscriptionPayload);
      log("✅", "Push subscription configured (POST)!");
      pushConfigured = true;
    } catch (err) {
      log("⚠️", `POST failed: ${err.message}`);
    }
  }

  // Try alternative format (some firmware versions use different field names)
  if (!pushConfigured) {
    const altPayload = {
      HttpHostNotification: {
        id: "1",
        url: CALLBACK_URL,
        protocolType: "HTTP",
        parameterFormatType: "JSON",
        addressingFormatType: "ipaddress",
        ipAddress: SERVER_IP,
        portNo: String(PUSH_PORT),
        userName: "",
        password: "",
        httpAuthenticationMethod: "none",
      },
    };

    try {
      log("💡", "Trying alternative payload format...");
      await hik._putJson("/ISAPI/Event/notification/httpHosts/1", altPayload);
      log("✅", "Push subscription configured (alt format)!");
      pushConfigured = true;
    } catch (err) {
      log("⚠️", `Alt format also failed: ${err.message}`);
    }
  }

  // Try the "subscribe" endpoint (some Hikvision access control models)
  if (!pushConfigured) {
    const subscribePath = "/ISAPI/Event/notification/subscribeEvent";
    const subPayload = {
      SubscribeEvent: {
        heartbeat: "30",
        eventMode: "all",
      },
    };
    try {
      log("💡", "Trying subscribeEvent endpoint...");
      await hik._postJson(subscribePath, subPayload);
      log("✅", "Event subscription created!");
      pushConfigured = true;
    } catch (err) {
      log("⚠️", `Subscribe endpoint failed: ${err.message}`);
    }
  }

  if (!pushConfigured) {
    log("❌", "Automatic configuration failed. Please configure manually:");
    console.log("");
    console.log("  Manual configuration instructions:");
    console.log("  ─────────────────────────────────");
    console.log(`  1. Open device web UI: https://${config.ip}`);
    console.log(`  2. Go to: Configuration → Network → Advanced Settings → HTTP Listening`);
    console.log(`  3. Add a listening host:`);
    console.log(`     - Listening IP: ${SERVER_IP}`);
    console.log(`     - Port: ${PUSH_PORT}`);
    console.log(`     - URL: /ISAPI/Event/notification/alertStream`);
    console.log(`  4. Enable "Authentication Event" or "Access Control Event"`);
    console.log(`  5. Save and test`);
    console.log("");
    console.log(`  Alternative path in some firmware versions:`);
    console.log(`  → Configuration → Event → HTTP Notification`);
    console.log("");
  }

  // 4. Verify
  if (pushConfigured) {
    console.log("");
    log("🔍", "Verifying subscription...");
    try {
      const verify = await hik._get("/ISAPI/Event/notification/httpHosts");
      const data = verify.json;
      const hosts = data?.HttpHostNotificationList?.HttpHostNotification;
      if (hosts) {
        const list = Array.isArray(hosts) ? hosts : [hosts];
        for (const h of list) {
          const ip = h.ipAddress || "?";
          const port = h.portNo || "?";
          const evt = h.eventType || "all";
          log("✅", `Active: ${ip}:${port} → ${h.url || "/"} (${evt})`);
        }
      }
    } catch {
      log("⚠️", "Could not verify — but subscription may still work");
    }
  }

  // 5. Summary
  console.log("\n═══════════════════════════════════════════");
  console.log("  Your Triple-Sync Setup:");
  console.log("═══════════════════════════════════════════");
  console.log(`  1. 🔴 PUSH (real-time)  — Device → http://${SERVER_IP}:${PUSH_PORT}`);
  console.log(`  2. 🔄 POLL (every 5min) — Service → Device (backup)`);
  console.log(`  3. 🖱️  MANUAL           — TopBar button (on-demand)`);
  console.log("═══════════════════════════════════════════\n");

  if (pushConfigured) {
    console.log("  ✅ Push is configured! Events will arrive in real-time.");
    console.log("  The poll + reconcile still run as backup.\n");
  } else {
    console.log("  ⚠️ Push needs manual setup (see instructions above).");
    console.log("  Poll + manual sync are still active.\n");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
