import PropertyModelingPageRefactored from '@/components/property/PropertyModelingPageRefactored';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default async function PropertyModeling({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <ProtectedRoute>
      <PropertyModelingPageRefactored propertyId={resolvedParams.id} />
    </ProtectedRoute>
  );
}
