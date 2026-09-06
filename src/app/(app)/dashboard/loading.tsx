import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return <div aria-busy="true" className="flex flex-col gap-6">
    <Skeleton className="h-20 w-64" />
    <Skeleton className="h-48 w-full" />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[0,1,2].map(i=><Skeleton key={i} className={`h-28 ${i===2?'col-span-2 sm:col-span-1':''}`} />)}</div>
    <div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
    <Skeleton className="h-64" />
  </div>;
}
