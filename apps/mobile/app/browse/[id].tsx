import { useLocalSearchParams } from 'expo-router';
import { ListingDetailView } from '@/components/marketplace/ListingDetailView';

export default function PublicListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ListingDetailView id={id} backLabel="Browse" />;
}
