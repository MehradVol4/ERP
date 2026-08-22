import SalesReport from "../features/sales-report";

const Page = () => {
  return (
    <SalesReport
      title="Weekly Sales"
      description="List of This Week's Sales"
      period="week"
    />
  );
};

export default Page;
