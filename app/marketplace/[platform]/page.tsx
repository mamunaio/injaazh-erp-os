import PlatformClient from "./PlatformClient";

export const metadata = {
  title: "Platform Projects | Injaazh ERP",
  description: "Marketplace Platform Projects",
};

export default async function PlatformPage({ 
  params 
}: { 
  params: Promise<{ platform: string }> 
}) {
  const { platform } = await params;
  return <PlatformClient platform={platform} />;
}
