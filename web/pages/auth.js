import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Auth() {
  const router = useRouter();
  const { shop } = router.query;

  useEffect(() => {
    if (shop) {
      // The Next.js rewrite will proxy this to the backend
      // But for OAuth, we need a full redirect to the backend
      // Since OAuth requires the exact callback URL, we redirect to backend
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      window.location.href = `${backendUrl}/auth?shop=${encodeURIComponent(shop)}`;
    }
  }, [shop]);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <p>Redirecting to Shopify OAuth...</p>
    </div>
  );
}

