"use client";

import { notFound } from "next/navigation";
import { NgoStubPage } from "@/src/components/ngo/NgoStubPage";
import { NGO_STUB_PAGE_TITLES } from "@/src/constants/ngo/ngoStubPages";

type PageProps = {
  params: { slug: string[] };
};

export default function NgoStubRoutePage({ params }: PageProps) {
  const segment = params.slug.join("/");
  const title = NGO_STUB_PAGE_TITLES[segment];

  if (!title) {
    notFound();
  }

  return <NgoStubPage title={title} />;
}
