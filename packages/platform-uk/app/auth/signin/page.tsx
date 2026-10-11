import { redirect } from "next/navigation";

type LegacySignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacySignInPage(props: LegacySignInPageProps) {
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value) && value[0]) {
      params.set(key, value[0]);
    }
  }

  const query = params.toString();
  redirect(query ? `/signin?${query}` : "/signin");
}
