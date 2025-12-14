export function AnalyticsContent() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Analytics</h2>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-white dark:bg-slate-950 p-4">
          <h3 className="font-semibold mb-2">Total Events</h3>
          <p className="text-3xl font-bold">24</p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-slate-950 p-4">
          <h3 className="font-semibold mb-2">Attendees</h3>
          <p className="text-3xl font-bold">1,245</p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-slate-950 p-4">
          <h3 className="font-semibold mb-2">Conversion Rate</h3>
          <p className="text-3xl font-bold">78%</p>
        </div>
      </div>
    </div>
  );
}
