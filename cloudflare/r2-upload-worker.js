const ALLOWED_ENTITY_TYPES = new Set(["profile", "team", "player", "tournament", "match"]);
const ALLOWED_MEDIA_TYPES = new Set(["image", "video", "card"]);
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Max-Age": "86400"
  };
}

function json(body, status = 200, env = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...corsHeaders(env)
    }
  });
}

function safePart(value, fallback = "unknown") {
  return String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || fallback;
}

function extensionFromName(name) {
  const match = String(name || "").match(/\.([a-z0-9]{1,8})$/i);
  return match ? `.${match[1].toLowerCase()}` : "";
}

async function requireSupabaseUser(request, env) {
  const authorization = request.headers.get("authorization");
  if (!authorization) throw new Error("Login required.");

  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      authorization,
      apikey: env.SUPABASE_ANON_KEY
    }
  });

  if (!response.ok) throw new Error("Invalid login session.");
  return response.json();
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (request.method !== "POST") {
      return json({ error: "Use POST to upload media." }, 405, env);
    }

    try {
      if (!env.MEDIA_BUCKET) throw new Error("MEDIA_BUCKET binding is missing.");
      if (!env.R2_PUBLIC_BASE_URL) throw new Error("R2_PUBLIC_BASE_URL is missing.");
      if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) throw new Error("Supabase auth variables are missing.");

      const user = await requireSupabaseUser(request, env);
      const form = await request.formData();
      const file = form.get("file");
      const entityType = safePart(form.get("entityType"));
      const entityId = safePart(form.get("entityId"), "new");
      const mediaType = safePart(form.get("mediaType"), "image");

      if (!file || typeof file === "string") throw new Error("File is required.");
      if (!ALLOWED_ENTITY_TYPES.has(entityType)) throw new Error("Invalid entity type.");
      if (!ALLOWED_MEDIA_TYPES.has(mediaType)) throw new Error("Invalid media type.");
      if (file.size > MAX_FILE_SIZE) throw new Error("File is too large. Max 50 MB.");

      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) throw new Error("Only images and videos are allowed.");

      const ext = extensionFromName(file.name);
      const key = `${entityType}/${entityId}/${mediaType}/${crypto.randomUUID()}-${safePart(file.name, "upload")}${ext}`;

      await env.MEDIA_BUCKET.put(key, file.stream(), {
        httpMetadata: {
          contentType: file.type || "application/octet-stream",
          cacheControl: "public, max-age=31536000, immutable"
        },
        customMetadata: {
          ownerUserId: user.id || "",
          originalName: file.name || ""
        }
      });

      const publicUrl = `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
      return json({
        key,
        publicUrl,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size
      }, 200, env);
    } catch (error) {
      return json({ error: error.message || "Upload failed." }, 400, env);
    }
  }
};
