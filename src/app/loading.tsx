// app/loading.tsx
export default function RootLoading() {
  return (
    <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-background/60 backdrop-blur'>
      <div className='flex flex-col items-center gap-4'>
        <div className='relative'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto' />
        </div>
        <p className='text-sm font-medium text-muted-foreground'>Loading...</p>
      </div>
    </div>
  );
}
