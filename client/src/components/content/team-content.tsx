export function TeamContent() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Team</h2>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-white dark:bg-slate-950 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
            <div>
              <h3 className="font-semibold text-sm">Sarah Johnson</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Event Manager</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white dark:bg-slate-950 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600" />
            <div>
              <h3 className="font-semibold text-sm">Michael Chen</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Coordinator</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white dark:bg-slate-950 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600" />
            <div>
              <h3 className="font-semibold text-sm">Emma Davis</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Marketing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
