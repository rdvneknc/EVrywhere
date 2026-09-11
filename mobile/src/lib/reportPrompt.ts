import { Alert } from 'react-native';
import {
  ReportTargetType,
  createReport,
} from '../api/moderation';

const REASONS = [
  'Spam / reklam',
  'Hakaret / taciz',
  'Yanıltıcı bilgi',
  'Uygunsuz içerik',
  'Diğer',
] as const;

export function promptReport(opts: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel?: string;
  onDone?: () => void;
}) {
  Alert.alert('Şikayet nedeni', 'Bir neden seç', [
    ...REASONS.map((reason) => ({
      text: reason,
      onPress: () => {
        void createReport({
          reporterId: opts.reporterId,
          targetType: opts.targetType,
          targetId: opts.targetId,
          reason,
          targetLabel: opts.targetLabel,
        })
          .then(() => {
            Alert.alert('Alındı', 'Şikayetin kaydedildi.');
            opts.onDone?.();
          })
          .catch((e) =>
            Alert.alert(
              'Gönderilemedi',
              e instanceof Error ? e.message : 'Tekrar dene.',
            ),
          );
      },
    })),
    { text: 'İptal', style: 'cancel' as const },
  ]);
}
