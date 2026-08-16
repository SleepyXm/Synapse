import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { modelId, conversation } = await req.json();

    // Call Hugging Face router
    const hfResponse = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: conversation,
        stream: true,
      }),
    });

    if (!hfResponse.ok) {
      const text = await hfResponse.text();
      console.error("HF error:", text);
      return NextResponse.json({ error: "LLM request failed" }, { status: 500 });
    }

    const data = await hfResponse.json();

    const reply = data.choices?.[0]?.message?.content ?? "No reply";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}