import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin, CONTRIBUTIONS_BUCKET } from "@/lib/supabase";

const MAX_IMAGES = 5;
const MAX_BODY = 10000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB per image

// POST /api/contributions  -> add a dated memory to a place. Requires auth.
// Accepts multipart/form-data: placeId, memoryDate, title, body, images[] (<=5).
export async function POST(request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Sign in to contribute" }, { status: 401 });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const placeId = form.get("placeId");
  const memoryDate = form.get("memoryDate");
  const title = (form.get("title") || "").toString().trim();
  const body = (form.get("body") || "").toString();
  const files = form.getAll("images").filter((f) => f && typeof f === "object" && f.size > 0);

  if (!placeId) {
    return Response.json({ error: "placeId is required" }, { status: 400 });
  }
  if (!memoryDate || Number.isNaN(Date.parse(memoryDate))) {
    return Response.json({ error: "A valid date is required" }, { status: 400 });
  }
  // The date must be in the past — today is reserved for the current establishment.
  const today = new Date().toISOString().slice(0, 10);
  if (memoryDate >= today) {
    return Response.json(
      { error: "Pick a date in the past — this is a memory of what used to be" },
      { status: 400 }
    );
  }
  if (body.length > MAX_BODY) {
    return Response.json({ error: `Text must be ${MAX_BODY} characters or fewer` }, { status: 400 });
  }
  if (!body.trim() && files.length === 0) {
    return Response.json({ error: "Add some text or at least one image" }, { status: 400 });
  }
  if (files.length > MAX_IMAGES) {
    return Response.json({ error: `Up to ${MAX_IMAGES} images allowed` }, { status: 400 });
  }
  for (const f of files) {
    if (f.size > MAX_IMAGE_BYTES) {
      return Response.json({ error: "Each image must be 8MB or smaller" }, { status: 400 });
    }
    if (!f.type?.startsWith("image/")) {
      return Response.json({ error: "Only image files are allowed" }, { status: 400 });
    }
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    console.error("supabase init failed:", err);
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }

  // Ensure the place exists.
  const { data: place } = await supabase
    .from("places")
    .select("id")
    .eq("id", placeId)
    .maybeSingle();
  if (!place) {
    return Response.json({ error: "Place not found" }, { status: 404 });
  }

  // Upload images to storage.
  const imageUrls = [];
  for (const file of files) {
    const ext = (file.name?.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${placeId}/${crypto.randomUUID()}.${ext || "jpg"}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadErr } = await supabase.storage
      .from(CONTRIBUTIONS_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (uploadErr) {
      console.error("image upload failed:", uploadErr);
      return Response.json({ error: "Image upload failed" }, { status: 500 });
    }
    const { data: pub } = supabase.storage.from(CONTRIBUTIONS_BUCKET).getPublicUrl(path);
    imageUrls.push(pub.publicUrl);
  }

  const user = await currentUser();
  const authorName =
    user?.username ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Anonymous";

  const { data: contribution, error: insertErr } = await supabase
    .from("contributions")
    .insert({
      place_id: placeId,
      user_id: userId,
      author_name: authorName,
      title: title || null,
      body,
      image_urls: imageUrls,
      memory_date: memoryDate,
      is_current: false,
    })
    .select("id, user_id, author_name, title, body, image_urls, memory_date, is_current, created_at")
    .single();

  if (insertErr) {
    console.error("create contribution failed:", insertErr);
    return Response.json({ error: "Failed to save contribution" }, { status: 500 });
  }

  return Response.json({ contribution }, { status: 201 });
}
