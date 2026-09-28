import { useI18n } from '../../i18n/I18nContext';

export function LoadingView() {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-950 text-slate-500">
      <span className="text-sm">{t('voices_loading')}</span>
    </div>
  );
}
