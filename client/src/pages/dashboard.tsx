import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ProductivityStreak } from "@/components/dashboard/productivity-streak";
import { TaskList } from "@/components/dashboard/task-list";
import { MeetingList } from "@/components/dashboard/meeting-list";
import { ProjectList } from "@/components/dashboard/project-list";
import { NoteList } from "@/components/dashboard/note-list";
import { useState } from "react";
import { Task, Meeting, Project, Note } from "@shared/schema";

export default function Dashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: meetings } = useQuery<Meeting[]>({
    queryKey: ['/api/meetings'],
  });

  const { data: notes } = useQuery<Note[]>({
    queryKey: ['/api/notes'],
  });

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const completedTasks = tasks?.filter(task => task.status === "COMPLETED").length || 0;
  const overdueTasks = tasks?.filter(task => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date() && task.status !== "COMPLETED";
  }).length || 0;

  const activeProjects = projects?.filter(project => project.status === "ACTIVE").length || 0;
  const completedProjects = projects?.filter(project => project.status === "COMPLETED").length || 0;

  const upcomingMeetings = meetings?.filter(meeting => {
    return new Date(meeting.startTime) > new Date();
  }).length || 0;

  const recentNotes = notes?.slice(0, 3).length || 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col md:ml-64 min-h-screen overflow-hidden">
        <Header onMenuToggle={toggleMobileMenu} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-secondary">
          <div>
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <SummaryCard 
                title="Tasks" 
                count={tasks?.length || 0} 
                icon="layers"
                stats={[
                  { label: "Done", value: completedTasks, color: "success" },
                  { label: "Overdue", value: overdueTasks, color: "accent" }
                ]}
              />
              
              <SummaryCard 
                title="Projects" 
                count={projects?.length || 0} 
                icon="folder"
                stats={[
                  { label: "Active", value: activeProjects, color: "primary" },
                  { label: "Completed", value: completedProjects, color: "success" }
                ]}
              />
              
              <SummaryCard 
                title="Meetings" 
                count={meetings?.length || 0} 
                icon="calendar"
                stats={[
                  { label: "Upcoming", value: upcomingMeetings, color: "primary" }
                ]}
              />
              
              <SummaryCard 
                title="Notes" 
                count={notes?.length || 0} 
                icon="file-text"
                stats={[
                  { label: "Recent", value: recentNotes, color: "primary" }
                ]}
              />
            </div>
            
            {/* Productivity Streak */}
            <ProductivityStreak streak={7} />
            
            {/* Tasks & Meetings Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <TaskList tasks={tasks || []} />
              <MeetingList meetings={meetings || []} />
            </div>
            
            {/* Projects Section */}
            <ProjectList projects={projects || []} />
            
            {/* Notes Section */}
            <NoteList notes={notes || []} />
          </div>
        </main>
      </div>
    </div>
  );
}
