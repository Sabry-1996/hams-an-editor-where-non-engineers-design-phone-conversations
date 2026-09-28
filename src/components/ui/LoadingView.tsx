import { useI18n } from '../../i18n/I18nContext';

export function LoadingView() {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 items-center justify-center bg-surface text-ink-3">
      <span className="text-sm">{t('voices_loading')}</span>
    </div>
  );
}
