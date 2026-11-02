import type { APIRoute } from "astro";
import { glossaryWithHtml } from "../../lib/glossary";

export const GET: APIRoute = async () => {
  const terms = await glossaryWithHtml();
  return new Response(JSON.stringify(terms), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
