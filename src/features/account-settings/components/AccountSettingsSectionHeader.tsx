interface AccountSettingsSectionHeaderProps {
  title: string
  description: string
}

export default function AccountSettingsSectionHeader({title, description}: AccountSettingsSectionHeaderProps) {
  return (
    <header className="border-b border-[var(--border)] pb-6">
      <h1 className="text-[1.6rem] font-bold tracking-tight text-[var(--text-primary)]">
        {title}
      </h1>

      <p className="mt-2 max-w-[620px] text-sm leading-6 text-[var(--text-muted)]">
        {description}
      </p>
    </header>
  )
}
