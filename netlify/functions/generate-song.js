exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let lyrics;
  try {
    lyrics = JSON.parse(event.body).lyrics;
  } catch (err) {
    return { statusCode: 400, body: "Invalid request body" };
  }

  if (!lyrics || typeof lyrics !== "string") {
    return { statusCode: 400, body: "Missing lyrics" };
  }

  const token = process.env.HF_TOKEN;
  if (!token) {
    return { statusCode: 500, body: "Server is missing HF_TOKEN configuration" };
  }

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/mms-tts-heb",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: lyrics }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return { statusCode: response.status, body: errText };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio: base64Audio, contentType: "audio/flac" }),
    };
  } catch (err) {
    return { statusCode: 502, body: "Upstream request failed" };
  }
};
