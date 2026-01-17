export default async function handler(req, res) {
  try {
    // TEMP: method check hata diya for debugging
    const zoneId = process.env.CF_ZONE_ID;
    const apiToken = process.env.CF_API_TOKEN;

    if (!zoneId || !apiToken) {
      return res.json({
        status: "error",
        message: "Cloudflare env vars missing"
      });
    }

    const url =
      `https://api.cloudflare.com/client/v4/zones/${zoneId}` +
      `/firewall/access_rules/rules?mode=block&configuration.target=ip`;

    // 🔥 timeout added (serverless safety)
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);

    const cfRes = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal
    });

    const data = await cfRes.json();

    return res.json({
      status: "success",
      cf_success: data.success,
      count: data.result?.length || 0,
      blocked_ips: data.result || []
    });

  } catch (err) {
    return res.json({
      status: "error",
      message:
        err.name === "AbortError"
          ? "Cloudflare API timeout"
          : err.message
    });
  }
}
