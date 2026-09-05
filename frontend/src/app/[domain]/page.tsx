import { redirect } from "next/navigation";

type TenantLandingPageProps = {
  params: Promise<{ domain: string }>;
};

export default async function TenantLandingPage({
  params,
}: TenantLandingPageProps) {
  const { domain } = await params;
  redirect(`/${domain}/mot/book`);
}
