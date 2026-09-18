export const config = {
  schedule: "*/10 * * * *",
};

export default async function handler(request) {
  const cronSecret = process.env.DISCORD_CRON_SECRET;
  const siteUrl = process.env.URL || new URL(request.url).origin;

  if (!cronSecret) {
    return Response.json(
      {
        ok: false,
        message: "DISCORD_CRON_SECRET is not configured.",
      },
      { status: 500 },
    );
  }

  const response = await fetch(`${siteUrl.replace(/\/$/, "")}/api/discord/expire`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${cronSecret}`,
      "user-agent": "zactrades-netlify-discord-access-sync",
    },
  });
  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json",
    },
  });
}
