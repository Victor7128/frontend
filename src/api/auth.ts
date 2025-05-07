import type { APIContext } from "astro";

export const GET = async ({ redirect }: APIContext) => {
  return redirect("/login", 302);
};
