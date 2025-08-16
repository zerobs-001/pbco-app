import PropertyModelingPage from '@/components/property/PropertyModelingPage';

export default function PropertyModeling({
  params,
}: {
  params: { id: string };
}) {
  return <PropertyModelingPage propertyId={params.id} />;
}
