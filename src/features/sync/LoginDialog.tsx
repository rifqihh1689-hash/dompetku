import type { DXCAlert, DXCUserInteraction } from 'dexie-cloud-addon'
import { useObservable } from 'dexie-react-hooks'
import { CircleAlert, Info, TriangleAlert } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import { db } from '../../db/db'
import { alertText, interactionTexts } from './texts'

const ALERT_STYLES: Record<DXCAlert['type'], { className: string; Icon: typeof Info }> = {
  info: { className: 'bg-sky-50 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200', Icon: Info },
  warning: { className: 'bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200', Icon: TriangleAlert },
  error: { className: 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200', Icon: CircleAlert },
}

/**
 * Dialog login Dexie Cloud berbahasa Indonesia (menggantikan tampilan bawaan add-on).
 * Muncul otomatis setiap kali Dexie Cloud meminta email, kode OTP, atau konfirmasi.
 */
export function LoginDialog() {
  const interaction = useObservable(db.cloud.userInteraction)
  return (
    <Modal open={!!interaction} title={interaction ? interactionTexts(interaction).title : ''} onClose={() => interaction?.onCancel()}>
      {/* `key` memastikan isian direset untuk setiap langkah (email → kode). */}
      {interaction && <InteractionForm key={`${interaction.type}-${interaction.alerts.length}`} interaction={interaction} />}
    </Modal>
  )
}

function InteractionForm({ interaction }: { interaction: DXCUserInteraction }) {
  const texts = interactionTexts(interaction)
  const fields = Object.entries(interaction.fields) as [string, { type: string }][]
  const [values, setValues] = useState<Record<string, string>>({})
  const baseId = useId()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const params = Object.fromEntries(fields.map(([name]) => [name, (values[name] ?? '').trim()]))
    interaction.onSubmit(params)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {interaction.type === 'email' && (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Masukkan email. Kami akan mengirim kode untuk masuk — tanpa kata sandi. Gunakan email yang sama di HP dan laptop agar datanya
          tersambung.
        </p>
      )}
      {interaction.alerts.map((alert, i) => {
        const { className, Icon } = ALERT_STYLES[alert.type]
        return (
          <p key={i} role={alert.type === 'error' ? 'alert' : 'status'} className={`flex gap-2 rounded-xl px-3 py-2 text-sm ${className}`}>
            <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{alertText(alert)}</span>
          </p>
        )
      })}
      {fields.map(([name, field], index) => {
        const id = `${baseId}-${name}`
        const isEmail = field.type === 'email' || name === 'email'
        const isOtp = field.type === 'otp' || name === 'otp'
        return (
          <div key={name}>
            <label htmlFor={id} className="label">
              {texts.fieldLabels[name] ?? name}
            </label>
            <input
              id={id}
              type={isEmail ? 'email' : field.type === 'password' ? 'password' : 'text'}
              inputMode={isEmail ? 'email' : isOtp ? 'numeric' : undefined}
              autoComplete={isEmail ? 'email' : isOtp ? 'one-time-code' : undefined}
              autoCapitalize="none"
              autoFocus={index === 0}
              required
              placeholder={texts.fieldPlaceholders[name]}
              value={values[name] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
              className={`field ${isOtp ? 'text-center text-xl tracking-[0.3em]' : ''}`}
            />
          </div>
        )
      })}
      <div className="flex gap-2 pt-1">
        {texts.cancelLabel && (
          <button type="button" className="btn-secondary" onClick={() => interaction.onCancel()}>
            {texts.cancelLabel}
          </button>
        )}
        <button type="submit" className={`${interaction.type === 'logout-confirmation' ? 'btn-danger' : 'btn-primary'} flex-1 py-3`}>
          {texts.submitLabel}
        </button>
      </div>
    </form>
  )
}
