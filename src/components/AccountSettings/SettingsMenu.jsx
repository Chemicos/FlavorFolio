/* eslint-disable react/prop-types */

export default function SettingsMenu({ onProfileEdit, onAccountManagement, onBack }) {
  return (
    <div className="flex flex-col items-start gap-2 w-[300px]">
        <button onClick={onProfileEdit}>Editează profilul</button>
        <button onClick={onAccountManagement}>Gestionarea contului</button>
        <button className="mt-10" onClick={onBack}>Înapoi</button>
    </div>
  )
}
