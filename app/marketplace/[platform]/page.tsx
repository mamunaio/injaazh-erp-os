import PlatformClient from "./PlatformClient";

export const metadata = {
  title: "Platform Projects | Injaazh ERP",
  description: "Marketplace Platform Projects",
};

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PlatformPage({ 
  params 
}: { 
  params: Promise<{ platform: string }> 
}) {
  const { platform } = await params;
  return <PlatformClient platform={platform} />;
}
