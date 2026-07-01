interface AccountSettingsSectionHeaderProps {
  title: string
  description: string
}

export default function AccountSettingsSectionHeader({title, description}: AccountSettingsSectionHeaderProps) {
  return (
    <header className="border-b border-white/10 pb-6">
      <h1 className="text-[1.6rem] font-bold tracking-tight text-white">
        {title}
      </h1>

      <p className="mt-2 max-w-[620px] text-sm leading-6 text-[#8f97b1]">
        {description}
      </p>
    </header>
  )
}
