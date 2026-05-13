import { ProjectTable } from "@/components/project-table"
import { CreateProjectForm } from "@/components/create-project-form"

export default function DashboardHome() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage your website modernization projects.
        </p>
      </div>

      <CreateProjectForm />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Active Projects</h2>
        </div>
        <ProjectTable />
      </div>
    </div>
  )
}
