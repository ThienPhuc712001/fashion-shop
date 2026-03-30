import { Suspense } from 'react';
import OrderDetailClient from './order-detail-client';
export default async function AdminOrderDetailPage({ params }) {
    const { id } = await params;
    return (<Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <OrderDetailClient orderId={id}/>
    </Suspense>);
}
