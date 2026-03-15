# 📝 Grid Notes

A daily note-taking application organized in grids. Built with Next.js 16, Prisma, and Supabase.

## ✨ Features

- **📊 Grid View** - Organize daily notes in a customizable grid layout
- **📋 List View** - View entries by category in chronological order
- **🏷️ Categories** - Create custom categories with icons and colors
- **📁 Workspaces** - Organize notes into separate workspaces
- **⚙️ Settings** - Customize grid columns and preferences
- **🗓️ Date Navigation** - Easy navigation between dates
- **💾 Auto-save** - Notes are saved automatically to Supabase

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and database

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd gridio
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Edit `.env` file and replace `[YOUR-PASSWORD]` with your actual Supabase database password:

```env
DATABASE_URL="postgresql://postgres.hksbjhcisvpovmnmznfu:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.hksbjhcisvpovmnmznfu:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

4. Push database schema to Supabase:
```bash
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📚 Database Schema

The app uses three main models:

- **Workspace** - Top-level organization unit
- **Category** - Note categories with custom icon and color
- **Entry** - Individual notes tied to a category and date

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio

## 📖 Usage

1. **Create a Workspace** - Start by creating your first workspace (e.g., "Skripsi", "Work")
2. **Add Categories** - Create categories for different types of notes (e.g., "Progress", "Tasks", "Ideas")
3. **Take Notes** - Navigate to Grid View, select a date, and add notes to each category
4. **View History** - Use List View to see all entries for a specific category

## 🎨 Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS 4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 7
- **Language**: TypeScript

## 📝 License

MIT

## 🙏 Credits

Inspired by the Streamlit Grid Notes application.
