import PropertyModelingPage from '@/components/property/PropertyModelingPage';

export default async function PropertyModeling({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <PropertyModelingPage propertyId={resolvedParams.id} />;
}
