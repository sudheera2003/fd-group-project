export function ProjectsContent() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Projects</h2>
      <div className="grid gap-4">
        <div className="rounded-lg border bg-white dark:bg-slate-950 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">Summer Conference 2025</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">June 15-17, 2025</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-200">
              In Progress
            </span>
          </div>
        </div>
        <div className="rounded-lg border bg-white dark:bg-slate-950 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">Tech Meetup Series</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly events</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-200">
              Planning
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
