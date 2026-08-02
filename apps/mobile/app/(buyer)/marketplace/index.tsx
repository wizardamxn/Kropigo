import { router } from 'expo-router';
import { MarketplaceList } from '@/components/marketplace/MarketplaceList';

export default function Marketplace() {
  return (
    <MarketplaceList
      onOpenListing={(id) => router.push({ pathname: '/(buyer)/marketplace/[id]', params: { id } })}
    />
  );
}
