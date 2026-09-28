import { getAllTablesSorted, getGroupRequests } from "@/lib/adminData";
import { GroupRequestList } from "@/components/admin/GroupRequestList";
import { AutoRefresh } from "@/components/admin/AutoRefresh";

export const dynamic = "force-dynamic";

export default async function AnfragenPage() {
  const [requests, tables] = await Promise.all([getGroupRequests(), getAllTablesSorted()]);

  return (
    <>
      <AutoRefresh />
      <GroupRequestList requests={requests} tables={tables} />
    </>
  );
}
