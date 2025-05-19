# ProductiTask

A modern productivity application for managing tasks, projects, meetings, and notes with a clean, Apple-inspired interface.

## Overview

ProductiTask is a comprehensive productivity tool designed to help users organize their work and personal life efficiently. The application provides a unified platform to manage various aspects of productivity, from simple task lists to complex project management.

## Features

- **Task Management**: Create, track, and complete tasks with priorities, due dates, and project assignments
- **Project Organization**: Group related tasks into projects for better organization
- **Meeting Scheduling**: Keep track of your meetings with start and end times, descriptions, and durations
- **Note Taking**: Capture ideas and information in a structured manner
- **Tag System**: Categorize items for easy filtering and organization
- **User Authentication**: Secure login and registration system with password protection
- **Responsive Design**: Seamless experience across desktop and mobile devices

## Tech Stack

- **Frontend**: React, TailwindCSS, Shadcn UI components
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session-based authentication
- **State Management**: TanStack Query (React Query)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   ```
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_session_secret
   ```
4. Run the database migrations:
   ```
   npm run db:push
   ```
5. Start the development server:
   ```
   npm run dev
   ```

## Usage

### Authentication

- Register a new account or log in with existing credentials
- All productivity features require authentication

### Dashboard

- Get an overview of your productivity metrics
- View recent tasks, projects, meetings, and notes

### Tasks

- Create tasks with titles, descriptions, and priorities
- Assign due dates and connect tasks to projects
- Filter and search through your task list

### Projects

- Organize related tasks into projects
- Track project status and progress

### Meetings

- Schedule meetings with start/end times
- Add descriptions and calculate duration automatically

### Notes

- Create and organize notes
- Add rich content to capture important information

### Tags

- Create color-coded tags
- Apply tags to various items for easy categorization

## Contributing

Contributions are welcome! If you'd like to enhance ProductiTask:

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Shadcn UI for the component library
- TailwindCSS for the styling framework
- Drizzle ORM for database interactions
- Replit for development and hosting