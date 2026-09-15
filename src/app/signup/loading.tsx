import { Skeleton } from "@/components/ui/skeleton";

export default function SignupLoading() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-8 space-y-3">
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

