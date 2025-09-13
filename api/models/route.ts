import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Read params from the request URL
  const searchTerm = searchParams.get("search") || "deepseek";
  const sortBy = searchParams.get("sort") || "trending";
  const withCount = searchParams.get("withCount") || "true";

  // Construct the Hugging Face API URL dynamically
  const url = `https://huggingface.co/models-json?sort=${sortBy}&search=${searchTerm}&withCount=${withCount}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch models");

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}