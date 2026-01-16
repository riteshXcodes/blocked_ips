import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    // Only allow GET
    if (req.method !== "GET") {
      return res.status(405).json({
        status: "error",
        message: "Method not allowed"
      });
    }

    const zoneId = process.env.CF_ZONE_ID;
    const apiToken = process.env.CF_API_TOKEN;

    if (!zoneId || !apiToken) {
      return res.status(500).json({
        status: "error",
        message: "Cloudflare env vars missing"
      });
    }

    const url =
      `https://api.cloudflare.com/client/v4/zones/${zoneId}` +
      `/firewall/access_rules/rules?mode=block&configuration.target=ip`;

    const cfRes = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      }
    });

    const data = await cfRes.json();

    if (!data.success) {
      return res.status(500).json({
        status: "error",
        message: "Cloudflare API error",
        errors: data.errors
      });
    }

    const blockedIPs = data.result.map(rule => ({
      rule_id: rule.id,
      ip: rule.configuration.value,
      note: rule.notes,
      created_at: rule.created_on
    }));

    return res.json({
      status: "success",
      provider: "cloudflare",
      count: blockedIPs.length,
      blocked_ips: blockedIPs
    });

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message
    });
  }
}
