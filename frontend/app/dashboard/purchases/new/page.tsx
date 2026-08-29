import { Suspense } from "react";
import PurchaseForm from "../features/purchase-form";

export default function NewPurchasePage() {
  return (
    <Suspense>
      <PurchaseForm />
    </Suspense>
  );
}
