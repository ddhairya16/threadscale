export function WelcomeHeader({ userEmail }: { userEmail: string }) {
  const name = userEmail.split('@')[0]
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <div className="flex flex-col gap-1 mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Good evening, {name}
      </h1>
      <p className="text-muted-foreground">
        Here's what's happening with your account today, {today}.
      </p>
    </div>
  )
}
