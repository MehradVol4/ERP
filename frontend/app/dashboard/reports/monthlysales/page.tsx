import SalesReport from "../features/sales-report";

const Page = () => {
  return (
    <SalesReport
      title="Monthly Sales"
      description="List of This Month's Sales"
      period="month"
    />
  );
};

export default Page;
